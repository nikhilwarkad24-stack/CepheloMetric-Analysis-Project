'use client';

import { useState, useRef, useEffect, type MouseEvent, type WheelEvent } from 'react';
import Image from 'next/image';
import {
  Upload,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  MousePointer,
  FileJson,
  CheckCircle2,
  Circle,
  BookOpen,
  Sparkles,
  LoaderCircle,
  Menu,
  LogOut,
  User as UserIcon,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { EducationalResources } from './educational-resources';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { detectLandmarks } from '@/ai/flows/detect-landmarks';
import type { DetectLandmarksOutput } from '@/ai/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { SubscriptionDialog } from './subscription-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface Landmark {
  id: string;
  name: string;
  x: number | null;
  y: number | null;
}

interface AnalysisResult {
  name: string;
  value: number;
  unit: string;
  interpretation: string;
}

interface AnalysisCategory {
    name: string;
    results: AnalysisResult[];
}

interface ViewTransform {
  scale: number;
  pan: { x: number; y: number };
}

type SubscriptionPlan = 'free' | 'standard' | 'premium';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  analysisCount: number;
  subscriptionStatus: SubscriptionPlan;
}

const FREE_ANALYSIS_LIMIT = 3;

const analysisCategories = [
    {
        name: "Steiner’s Analysis",
        landmarks: [
            { id: 'S', name: 'Sella' },
            { id: 'N', name: 'Nasion' },
            { id: 'A', name: 'Point A' },
            { id: 'B', name: 'Point B' },
            { id: 'Go', name: 'Gonion' },
            { id: 'Gn', name: 'Gnathion' },
            { id: 'U1T', name: 'Upper Incisor Tip' },
            { id: 'U1A', name: 'Upper Incisor Apex' },
            { id: 'L1T', name: 'Lower Incisor Tip' },
            { id: 'L1A', name: 'Lower Incisor Apex' },
            { id: 'OPant', name: 'Occlusal Plane (Anterior)' },
            { id: 'OPpost', name: 'Occlusal Plane (Posterior)' },
        ]
    },
    {
        name: "Downs Analysis",
        landmarks: [
            { id: 'Po', name: 'Porion' },
            { id: 'Or', name: 'Orbitale' },
            { id: 'N', name: 'Nasion' },
            { id: 'A', name: 'Point A' },
            { id: 'Pog', name: 'Pogonion' },
            { id: 'Go', name: 'Gonion' },
            { id: 'Me', name: 'Menton' },
            { id: 'S', name: 'Sella' },
            { id: 'Gn', name: 'Gnathion' },
            { id: 'B', name: 'Point B' },
            { id: 'U1T', name: 'Upper Incisor Tip' },
            { id: 'OPant', name: 'Occlusal Plane (Anterior)' },
            { id: 'OPpost', name: 'Occlusal Plane (Posterior)' },
        ]
    },
    {
        name: "Tweed’s Analysis",
        landmarks: [
            { id: 'Po', name: 'Porion' },
            { id: 'Or', name: 'Orbitale' },
            { id: 'Go', name: 'Gonion' },
            { id: 'Me', name: 'Menton' },
            { id: 'L1A', name: 'Lower Incisor Apex' },
            { id: 'L1T', name: 'Lower Incisor Tip' },
        ]
    },
    {
        name: "Rakosi Analysis",
        landmarks: [
          { id: 'S', name: 'Sella' },
          { id: 'N', name: 'Nasion' },
          { id: 'Ar', name: 'Articulare' },
          { id: 'Go', name: 'Gonion' },
          { id: 'Me', name: 'Menton' },
        ]
    },
    {
        name: "McNamara’s Analysis",
        landmarks: [
            { id: 'N', name: 'Nasion' },
            { id: 'A', name: 'Point A' },
            { id: 'Pog', name: 'Pogonion' },
            { id: 'Po', name: 'Porion' },
            { id: 'Or', name: 'Orbitale' },
            { id: 'Ba', name: 'Basion' },
            { id: 'S', name: 'Sella' },
            { id: 'Go', name: 'Gonion' },
            { id: 'Gn', name: 'Gnathion' },
            { id: 'Ptm', name: 'Pterygomaxillary Fissure'},
            { id: 'L1T', name: 'Lower Incisor Tip' },
            { id: 'U1T', name: 'Upper Incisor Tip' },
        ]
    },
    {
        name: 'Ricketts Analysis',
        landmarks: [
          { id: 'Ba', name: 'Basion' },
          { id: 'N', name: 'Nasion' },
          { id: 'Ptm', name: 'Pterygomaxillary Fissure' },
          { id: 'Gn', name: 'Gnathion' },
          { id: 'Po', name: 'Porion' },
          { id: 'Or', name: 'Orbitale' },
          { id: 'A', name: 'Point A' },
          { id: 'Pog', name: 'Pogonion' },
          { id: 'L1T', name: 'Lower Incisor Tip' },
          { id: 'U6T', name: 'Upper Molar Tip' },
          { id: 'L6T', name: 'Lower Molar Tip' },
        ]
    },
    {
        name: 'Wits Appraisal',
        landmarks: [
            { id: 'A', name: 'Point A' },
            { id: 'B', name: 'Point B' },
            { id: 'OPant', name: 'Occlusal Plane (Anterior)' },
            { id: 'OPpost', name: 'Occlusal Plane (Posterior)' },
        ]
    }
];

const PREDEFINED_LANDMARKS: Omit<Landmark, 'x' | 'y'>[] = [
    ...new Map(analysisCategories.flatMap(c => c.landmarks).map(item => [item.id, item])).values()
];

const analysisLineMap: Record<string, string[][]> = {
  SNA: [['S', 'N'], ['N', 'A']],
  SNB: [['S', 'N'], ['N', 'B']],
  ANB: [['A', 'N'], ['N', 'B']],
  'Mandibular plane Angle': [['S', 'N'], ['Go', 'Gn']],
  'Upper incisor to NA Angle': [['U1A', 'U1T'], ['N', 'A']],
  'Upper incisor to NA Linear (mm)': [['U1T', 'A'], ['A', 'N']],
  'Lower incisor to NB Angle': [['L1A', 'L1T'], ['N', 'B']],
  'Lower incisor to NB Linear(mm)': [['L1T', 'B'], ['B', 'N']],
  'Interincisal angle': [['U1A', 'U1T'], ['L1A', 'L1T']],
  'Occlusal plane angle': [['OPpost', 'OPant'], ['S', 'N']],
  'Facial Angle': [['Po', 'Or'], ['N', 'Pog']],
  'Angle of Convexity': [['N', 'A'], ['A', 'Pog']],
  'Downs Mandibular Plane': [['Po', 'Or'], ['Go', 'Me']],
  'Y-Axis': [['S', 'Gn'], ['Po', 'Or']],
  'A-B Plane Angle': [['A','B'], ['N','Pog']],
  "Cant of Occlusal plane": [['Po', 'Or'], ['OPant', 'OPpost']],
  "Upper incisor to A-Pog Line (mm)": [['U1A', 'U1T'], ['A', 'Pog']],
  FMA: [['Po', 'Or'], ['Go', 'Me']],
  IMPA: [['Go', 'Me'], ['L1A', 'L1T']],
  FMIA: [['Po', 'Or'], ['L1A', 'L1T']],
  'Saddle angle': [['N','S'],['S', 'Ar']],
  'Facial axis angle (Rakosi)': [['Ptm', 'Gn'], ['Ba', 'N']],
  'Maxillary skeletal position (N perp to A)': [['N', 'A']],
  'Mandibular position (N perp to Pog)': [['N', 'Pog']],
  'Mandibular plane angle (McNamara)': [['Po', 'Or'], ['Go', 'Gn']],
  'Facial axis angle (McNamara)': [['Ptm', 'Gn'], ['Ba', 'S']],
  'Lower incisor protrusion': [['L1T', 'A'],['A', 'Pog']],
  'Upper incisor protrusion': [['U1T', 'A'],['A', 'Pog']],
  'Facial Axis (Ricketts)': [['Ptm', 'Gn'], ['Ba', 'N']],
  'Facial Depth (Ricketts)': [['Po', 'Or'],['N','A']],
  'Mandibular Plane (Ricketts)': [['Go', 'Gn'], ['Po', 'Or']],
  'Wits Appraisal': [['A', 'B']],
};

function SidebarContent({
  handleFileSelect,
  handleDetectLandmarks,
  isDetecting,
  image,
  landmarks,
  selectedLandmarkId,
  setSelectedLandmarkId,
  hoveredLandmark,
  setHoveredLandmark,
  handleGenerateReportClick,
  allLandmarksPlaced,
  analysis,
  hoveredAnalysis,
  setHoveredAnalysis,
  handleExport,
  fileInputRef,
  handleFileUpload,
  subscriptionStatus,
}: {
  handleFileSelect: () => void;
  handleDetectLandmarks: () => void;
  isDetecting: boolean;
  image: { src: string; } | null;
  landmarks: Landmark[];
  selectedLandmarkId: string | null;
  setSelectedLandmarkId: (id: string | null) => void;
  hoveredLandmark: string | null;
  setHoveredLandmark: (id: string | null) => void;
  handleGenerateReportClick: () => void;
  allLandmarksPlaced: boolean;
  analysis: AnalysisCategory[] | null;
  hoveredAnalysis: string | null;
  setHoveredAnalysis: (id: string | null) => void;
  handleExport: (type: 'image' | 'csv' | 'report') => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  subscriptionStatus: SubscriptionPlan | undefined;
}) {
  const isPremium = subscriptionStatus === 'premium';
  
  const AiDetectButton = (
    <Button onClick={handleDetectLandmarks} disabled={!image || isDetecting || !isPremium} className="w-full">
        {isDetecting ? (
            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
        ) : (
            <Sparkles className="w-4 h-4 mr-2" />
        )}
        AI Detect
    </Button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <Button onClick={handleFileSelect} className="w-full">
            <Upload className="w-4 h-4 mr-2" /> Upload
        </Button>
        {!isPremium ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{AiDetectButton}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Subscribe to Premium to use AI detection.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          AiDetectButton
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/png, image/jpeg" />
      </div>
      <Separator />
      
      <ScrollArea className="flex-1">
        <Card className="m-2 md:m-4 border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-xl"><MousePointer className="w-5 h-5" /> Landmark Placement</CardTitle>
          </CardHeader>
          <CardContent>
            {!image && <div className="text-sm text-muted-foreground">Upload an image to start.</div>}
            {image && (
              <Accordion type="single" collapsible className="w-full" defaultValue="Steiner’s Analysis">
                 {analysisCategories.map(category => (
                    <AccordionItem value={category.name} key={category.name}>
                        <AccordionTrigger>{category.name}</AccordionTrigger>
                        <AccordionContent>
                           <p className="text-xs md:text-sm text-muted-foreground mb-4">Click to select a landmark, then click on the image to place it.</p>
                            <ul className="space-y-1 text-sm h-96 overflow-y-auto no-scrollbar">
                                {category.landmarks.map(l => {
                                    const landmark = landmarks.find(lm => lm.id === l.id);
                                    if (!landmark) return null;
                                    return (
                                        <li key={l.id} 
                                            onClick={() => setSelectedLandmarkId(l.id)}
                                            onMouseEnter={() => setHoveredLandmark(l.id)}
                                            onMouseLeave={() => setHoveredLandmark(null)}
                                            className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${hoveredLandmark === l.id ? 'bg-accent/20' : ''} ${selectedLandmarkId === l.id ? 'bg-accent/30 ring-2 ring-accent' : ''}`}
                                        >
                                            {landmark.x !== null ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0"/> : <Circle className="w-5 h-5 text-muted-foreground shrink-0"/>}
                                            <span className="truncate">{l.name} ({l.id})</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Separator className="my-2"/>

        <Card className="m-2 md:m-4 border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-xl"><FileText className="w-5 h-5" /> Analysis Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateReportClick} className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            {analysis && (
                 <div className="p-2 mt-4 border rounded-md bg-secondary/30" id="report-content">
                    <Accordion type="multiple" className="w-full" defaultValue={analysisCategories.map(c => c.name)}>
                       {analysis.map(category => (
                         <AccordionItem value={category.name} key={category.name}>
                             <AccordionTrigger>{category.name}</AccordionTrigger>
                             <AccordionContent>
                                 <Table>
                                     <TableHeader>
                                         <TableRow>
                                             <TableHead>Measurement</TableHead>
                                             <TableHead className="text-right">Value</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         {category.results.map((item) => (
                                             <TableRow 
                                                 key={item.name}
                                                 onMouseEnter={() => setHoveredAnalysis(item.name)}
                                                 onMouseLeave={() => setHoveredAnalysis(null)}
                                                 className="cursor-pointer"
                                             >
                                                 <TableCell>
                                                     <div className="font-medium text-xs md:text-sm">{item.name}</div>
                                                     <div className="text-xs text-muted-foreground">{item.interpretation}</div>
                                                 </TableCell>
                                                 <TableCell className="text-right font-mono text-xs md:text-sm">{item.value.toFixed(1)}{item.unit}</TableCell>
                                             </TableRow>
                                         ))}
                                     </TableBody>
                                 </Table>
                             </AccordionContent>
                         </AccordionItem>
                       ))}
                    </Accordion>
                </div>
            )}
          </CardContent>
        </Card>
      </ScrollArea>
      
      <Separator />
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base">Export</h3>
        <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('image')} disabled={!image}><Download className="w-4 h-4 mr-1"/>Image</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={landmarks.filter(l => l.x !== null).length === 0}><FileJson className="w-4 h-4 mr-1"/>CSV</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('report')} disabled={!analysis}><Printer className="w-4 h-4 mr-1"/>Report</Button>
        </div>
      </div>
    </div>
  );
}


export function CephalometricStudio() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const transformContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();



  const [image, setImage] = useState<{ src: string; naturalWidth: number; naturalHeight: number } | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisCategory[] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<AppUser>(userDocRef);
  const [localUserData, setLocalUserData] = useState<AppUser | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('user');
      if (s) {
        const p = JSON.parse(s);
        setLocalUserData({
          uid: p.id || p.uid || p.email || 'guest',
          email: p.email || '',
          displayName: p.name || p.displayName || p.email || 'Guest',
          photoURL: p.photoURL || '',
          analysisCount: 0,
          subscriptionStatus: (p.subscriptionStatus as SubscriptionPlan) || 'free',
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const effectiveUserData = userData ?? localUserData;
  
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ scale: 1, pan: { x: 0, y: 0 } });
  const [isPanning, setIsPanning] = useState(false);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [draggedLandmark, setDraggedLandmark] = useState<string | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<string | null>(null);
  const [hoveredAnalysis, setHoveredAnalysis] = useState<string | null>(null);
  
  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'G'; // Guest
    if (user?.isAnonymous) return 'G';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getSubscriptionPlanName = (status: SubscriptionPlan | undefined) => {
    switch(status) {
      case 'standard': return 'Standard Plan';
      case 'premium': return 'Premium Plan';
      default: return 'Free Trial';
    }
  }

  const resetState = () => {
    setImage(null);
    setLandmarks([]);
    setAnalysis(null);
    setSelectedLandmarkId(null);
    setViewTransform({ scale: 1, pan: { x: 0, y: 0 } });
  };
  
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      resetState();
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        const img = document.createElement('img');
        img.onload = async () => {
          setImage({ src: img.src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
          setLandmarks(PREDEFINED_LANDMARKS.map(l => ({...l, x: null, y: null})));
          setSelectedLandmarkId(PREDEFINED_LANDMARKS[0].id);
          fitImageToView(img.naturalWidth, img.naturalHeight);
        };
        img.src = dataUri;
      };
      reader.readAsDataURL(file);
    } else {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a PNG or JPG file.' });
    }
    event.target.value = '';
  };
  
  const handleDetectLandmarks = async () => {
    if (!image || !userData || userData.subscriptionStatus !== 'premium') {
        toast({
            variant: 'destructive',
            title: 'Premium Feature',
            description: 'AI Landmark Detection is a premium feature. Please upgrade your plan.',
        });
        return;
    }
    setIsDetecting(true);
    setAnalysis(null);
    try {
      const result: DetectLandmarksOutput = await detectLandmarks({ photoDataUri: image.src });
      
      const landmarkMap = new Map(result.landmarks.map(l => [l.id, l]));

      setLandmarks(currentLandmarks => {
        const updatedLandmarks = currentLandmarks.map(landmark => {
            const detected = landmarkMap.get(landmark.id);
            if(detected) {
                return { ...landmark, x: detected.x, y: detected.y };
            }
            return landmark;
        });
        return updatedLandmarks;
      });

      setSelectedLandmarkId(null);
      toast({ title: 'AI Detection Complete', description: 'Landmarks have been automatically placed.' });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Detection Failed',
        description: `An error occurred during AI processing. ${error instanceof Error ? error.message : ''}`,
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const fitImageToView = (naturalWidth: number, naturalHeight: number) => {
    if (!imageViewerRef.current) return;
    const { width: viewWidth, height: viewHeight } = imageViewerRef.current.getBoundingClientRect();
    const scaleX = viewWidth / naturalWidth;
    const scaleY = viewHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const pan = {
      x: (viewWidth - naturalWidth * scale) / 2,
      y: (viewHeight - naturalHeight * scale) / 2,
    };
    setViewTransform({ scale, pan });
  };
  
  useEffect(() => {
    const handleResize = () => {
        if(image) fitImageToView(image.naturalWidth, image.naturalHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [image]);

  const handleZoom = (e: WheelEvent<HTMLDivElement>) => {
    if (!imageViewerRef.current) return;
    const zoomFactor = 1 - e.deltaY * 0.001;
    
    const { left, top } = imageViewerRef.current.getBoundingClientRect();

    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    const newScale = Math.max(0.1, Math.min(10, viewTransform.scale * zoomFactor));
    
    const newPanX = mouseX - (mouseX - viewTransform.pan.x) * (newScale / viewTransform.scale);
    const newPanY = mouseY - (mouseY - viewTransform.pan.y) * (newScale / viewTransform.scale);

    setViewTransform({ scale: newScale, pan: { x: newPanX, y: newPanY } });
  };
  
  const handleManualZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -100 : 100;
    const zoomFactor = 1 - delta * 0.001;
    const newScale = Math.max(0.1, Math.min(10, viewTransform.scale * zoomFactor));
    setViewTransform(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setViewTransform(prev => ({ ...prev, pan: { x: prev.pan.x + e.movementX, y: prev.pan.y + e.movementY } }));
    } else if (draggedLandmark && transformContainerRef.current) {
        const rect = transformContainerRef.current.getBoundingClientRect();
        const newX = (e.clientX - rect.left) / viewTransform.scale;
        const newY = (e.clientY - rect.top) / viewTransform.scale;

        setLandmarks(prev => prev.map(l => l.id === draggedLandmark ? { ...l, x: newX, y: newY } : l));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedLandmark(null);
  };
  
  const handlePlacementClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning || draggedLandmark || !selectedLandmarkId || !transformContainerRef.current) return;
    
    const rect = transformContainerRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left) / viewTransform.scale;
    const newY = (e.clientY - rect.top) / viewTransform.scale;

    setLandmarks(prev => {
        const newLandmarks = prev.map(l => l.id === selectedLandmarkId ? { ...l, x: newX, y: newY } : l);
        const currentIndex = PREDEFINED_LANDMARKS.findIndex(l => l.id === selectedLandmarkId);
        const nextLandmark = landmarks.slice(currentIndex + 1).find(l => l.x === null) || landmarks.find(l => l.x === null);
        setSelectedLandmarkId(nextLandmark ? nextLandmark.id : null);
        return newLandmarks;
    });
  };

  const allLandmarksPlaced = landmarks.length > 0 && landmarks.every(l => {
    const requiredForSomeAnalysis = analysisCategories.some(cat => cat.landmarks.some(cl => cl.id === l.id));
    return !requiredForSomeAnalysis || (l.x !== null && l.y !== null);
  });

  const calculateAngle = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ): number => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    const cosTheta = dotProduct / (magnitude1 * magnitude2);
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));
    
    const angleRad = Math.acos(clampedCosTheta);
    
    return angleRad * (180 / Math.PI);
  };

  const calculateAngleBetweenLines = (
    line1P1: { x: number; y: number },
    line1P2: { x: number; y: number },
    line2P1: { x: number; y: number },
    line2P2: { x: number; y: number }
  ): number => {
    const angle1 = Math.atan2(line1P2.y - line1P1.y, line1P2.x - line1P1.x);
    const angle2 = Math.atan2(line2P2.y - line2P1.y, line2P2.x - line2P1.x);
    
    let angleDegrees = (angle1 - angle2) * (180 / Math.PI);
    angleDegrees = Math.abs(angleDegrees);

    if (angleDegrees > 180) {
      angleDegrees = 360 - angleDegrees;
    }
    
    // Always return the acute angle
    if (angleDegrees > 90) {
        angleDegrees = 180 - angleDegrees;
    }

    return angleDegrees;
  };
  
  const calculateDistance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  const calculateDistanceToLine = (
    point: { x: number; y: number },
    lineP1: { x: number; y: number },
    lineP2: { x: number; y: number }
  ): number => {
      const { x: x0, y: y0 } = point;
      const { x: x1, y: y1 } = lineP1;
      const { x: x2, y: y2 } = lineP2;

      // Vertical line
      if (x1 === x2) {
        return Math.abs(x0 - x1);
      }

      // Horizontal line
      if (y1 === y2) {
        return Math.abs(y0 - y1);
      }

      const numerator = Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1));
      const denominator = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      if (denominator === 0) return 0;
      return numerator / denominator;
  };

  const getPerpendicularPoint = (
    point: { x: number; y: number },
    lineP1: { x: number; y: number },
    lineP2: { x: number; y: number }
  ): { x: number; y: number } => {
      const { x: px, y: py } = point;
      const { x: x1, y: y1 } = lineP1;
      const { x: x2, y: y2 } = lineP2;
      
      const dx = x2 - x1;
      const dy = y2 - y1;
  
      if (dx === 0 && dy === 0) return lineP1; // Line is a point
  
      const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
      
      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
  
      return { x: closestX, y: closestY };
  };

  const handleGenerateReportClick = () => {
    if (!effectiveUserData) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not verify user data. Please try again.',
      });
      return;
    }

    if (effectiveUserData.subscriptionStatus === 'free' && effectiveUserData.analysisCount >= FREE_ANALYSIS_LIMIT) {
      setShowSubscriptionDialog(true);
      return;
    }
  
    handleCalculateAngles();
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!userDocRef) {
        toast({ variant: 'destructive', title: 'Subscription Failed', description: 'Could not find user data.' });
        return;
    }

    try {
        await updateDoc(userDocRef, { subscriptionStatus: plan });
        toast({ title: 'Success!', description: `You are now subscribed to the ${plan} Plan.` });
        setShowSubscriptionDialog(false);
        router.push('/studio');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Subscription Failed', description: 'An error occurred. Please try again.' });
    }
  };


  const handleCalculateAngles = async () => {
    if (!allLandmarksPlaced) return;
    setAnalysis(null);

    try {
        const landmarkMap = new Map(landmarks.map((l) => [l.id, l]));
        const requiredIds = PREDEFINED_LANDMARKS.map(l => l.id);
        const missingLandmarks = requiredIds.filter(id => {
            const l = landmarkMap.get(id);
            const isRequired = analysisCategories.some(cat => cat.landmarks.some(cl => cl.id === id));
            return isRequired && (!l || l.x === null || l.y === null);
        });

        if (missingLandmarks.length > 0) {
          toast({
            variant: 'destructive',
            title: 'Missing Landmarks',
            description: `Please place the following landmarks: ${missingLandmarks.join(', ')}`,
          });
          return;
        }

        const getPoint = (id: string) => {
            const l = landmarkMap.get(id);
            if (!l || l.x === null || l.y === null) throw new Error(`Landmark ${id} is not placed.`);
            return { x: l.x, y: l.y };
        };

        const pS = getPoint('S');
        const pN = getPoint('N');
        const pA = getPoint('A');
        const pB = getPoint('B');
        const pPog = getPoint('Pog');
        const pMe = getPoint('Me');
        const pGo = getPoint('Go');
        const pGn = getPoint('Gn');
        const pU1T = getPoint('U1T');
        const pU1A = getPoint('U1A');
        const pL1T = getPoint('L1T');
        const pL1A = getPoint('L1A');
        const pOPant = getPoint('OPant');
        const pOPpost = getPoint('OPpost');
        const pOr = getPoint('Or');
        const pPo = getPoint('Po');
        const pAr = getPoint('Ar');
        const pBa = getPoint('Ba');
        const pPtm = getPoint('Ptm');

        // Steiner's Analysis
        const snaAngle = calculateAngle(pS, pN, pA);
        const snbAngle = calculateAngle(pS, pN, pB);
        const anbAngle = snaAngle - snbAngle;
        const snGoGnAngle = calculateAngleBetweenLines(pS, pN, pGo, pGn);
        const u1NAAngle = calculateAngleBetweenLines(pU1A, pU1T, pN, pA);
        const u1NADist = calculateDistanceToLine(pU1T, pN, pA);
        const l1NBAngle = calculateAngleBetweenLines(pL1A, pL1T, pN, pB);
        const l1NBDist = calculateDistanceToLine(pL1T, pN, pB);
        const interincisalAngleSteiner = 180 - calculateAngle(pU1A, {x: (pU1T.x + pL1T.x) / 2, y: (pU1T.y + pL1T.y) / 2}, pL1A);
        const occlusalPlaneAngle = calculateAngleBetweenLines(pS, pN, pOPpost, pOPant);
        
        // Downs Analysis
        const facialAngle = 180 - calculateAngle(pPo, pN, pPog);
        
        let angleOfConvexity = calculateAngle(pN, pA, pPog);
        const crossProduct = (pA.x - pN.x) * (pPog.y - pN.y) - (pA.y - pN.y) * (pPog.x - pN.x);
        if (crossProduct > 0) { 
          angleOfConvexity = -angleOfConvexity;
        }

        const downsMandibularPlaneAngle = calculateAngleBetweenLines(pGo, pMe, pPo, pOr);
        const yAxisAngle = calculateAngleBetweenLines(pS, pGn, pPo, pOr);
        
        let abPlaneAngle = calculateAngleBetweenLines(pA, pB, pN, pPog);
        if (abPlaneAngle > 90) abPlaneAngle = 180 - abPlaneAngle;

        const cantOfOcclusalPlane = calculateAngleBetweenLines(pPo, pOr, pOPant, pOPpost);
        const upperIncisorToAPog = calculateDistanceToLine(pU1T, pA, pPog);

        
        // Tweed's Analysis
        const fmaAngle = calculateAngleBetweenLines(pPo, pOr, pGo, pMe);
        const impaAngle = 180 - calculateAngleBetweenLines(pGo, pMe, pL1A, pL1T);
        const fmiaAngle = calculateAngleBetweenLines(pPo, pOr, pL1A, pL1T);

        // Rakosi Analysis
        const saddleAngle = calculateAngle(pN, pS, pAr);
        const articulareAngle = calculateAngle(pS, pAr, pGo);
        const gonialAngle = calculateAngle(pAr, pGo, pMe);
        const facialAxisAngleRakosi = 90 - calculateAngleBetweenLines(pPtm, pGn, pBa, pN);
        const mandibularBodyLength = calculateDistance(pGo, pGn);
        const sGo = calculateDistance(pS, pGo);
        const nMe = calculateDistance(pN, pMe);
        const posteriorAnteriorFaceHeightRatio = (sGo / nMe) * 100;
        
        // McNamara Analysis
        const nPerpPoint = getPerpendicularPoint(pA, pPo, pOr);
        const maxillarySkeletalPosition = calculateDistance(pA, nPerpPoint);
        const nPerpPog = getPerpendicularPoint(pPog, pPo, pOr);
        const mandibularPosition = calculateDistance(pPog, nPerpPog);
        const maxillomandibularDifference = mandibularPosition - maxillarySkeletalPosition;
        const mandibularPlaneAngleMcNamara = calculateAngleBetweenLines(pGo, pGn, pPo, pOr);
        const facialAxisAngleMcNamara = calculateAngleBetweenLines(pPtm, pGn, pBa, pS);
        const lowerIncisorProtrusion = calculateDistanceToLine(pL1T, pA, pPog);
        const upperIncisorProtrusion = calculateDistanceToLine(pU1T, pA, pPog);

        // Ricketts Analysis
        const rickettsFacialAxis = 90 - calculateAngleBetweenLines(pPtm, pGn, pBa, pN);
        const rickettsFacialDepth = calculateAngleBetweenLines(pPo, pOr, pN, pA);
        const rickettsMandibularPlane = calculateAngleBetweenLines(pPo, pOr, pGo, pGn);
        const rickettsConvexity = calculateDistanceToLine(pA, pBa, pN);
        const rickettsLowerIncisor = calculateDistanceToLine(pL1T, pA, pPog);

        // Wits Appraisal
        const pointAOnOcclusal = getPerpendicularPoint(pA, pOPant, pOPpost);
        const pointBOnOcclusal = getPerpendicularPoint(pB, pOPant, pOPpost);
        const witsValue = calculateDistance(pointAOnOcclusal, pointBOnOcclusal);
        const witsSign = (pointAOnOcclusal.x < pointBOnOcclusal.x) ? 1 : -1;
        const signedWitsValue = witsValue * witsSign;


      const getInterpretation = (name: string, value: number): string => {
        switch (name) {
          // Steiner's
          case 'SNA':
            if (value > 84) return 'Prognathic maxilla. Normal: 82° ± 2°.';
            if (value < 80) return 'Retrognathic maxilla. Normal: 82° ± 2°.';
            return 'Normal maxillary position. Normal: 82° ± 2°.';
          case 'SNB':
            if (value > 82) return 'Prognathic mandible. Normal: 80° ± 2°.';
            if (value < 78) return 'Retrognathic mandible. Normal: 80° ± 2°.';
            return 'Normal mandibular position. Normal: 80° ± 2°.';
          case 'ANB':
            if (value > 4) return 'Skeletal Class II tendency. Normal: 2° ± 2°.';
            if (value < 0) return 'Skeletal Class III tendency. Normal: 2° ± 2°.';
            return 'Skeletal Class I relationship. Normal: 2° ± 2°.';
          case 'Mandibular plane Angle':
            if (value > 37) return 'High angle (vertical growth). Normal: 32° ± 5°.';
            if (value < 27) return 'Low angle (horizontal growth). Normal: 32° ± 5°.';
            return 'Normal mandibular plane angle. Normal: 32° ± 5°.';
          case 'Upper incisor to NA Angle':
            if (value > 28) return 'Proclined upper incisors. Normal: 22° ± 6°.';
            if (value < 16) return 'Retroclined upper incisors. Normal: 22° ± 6°.';
            return 'Normal upper incisor inclination. Normal: 22° ± 6°.';
          case 'Upper incisor to NA Linear (mm)':
            if (value > 6) return 'Protrusive upper incisors. Normal: 4mm ± 2mm.';
            if (value < 2) return 'Retrusive upper incisors. Normal: 4mm ± 2mm.';
            return 'Normal upper incisor position. Normal: 4mm ± 2mm.';
          case 'Lower incisor to NB Angle':
            if (value > 30) return 'Proclined lower incisors. Normal: 25° ± 5°.';
            if (value < 20) return 'Retroclined lower incisors. Normal: 25° ± 5°.';
            return 'Normal lower incisor inclination. Normal: 25° ± 5°.';
          case 'Lower incisor to NB Linear(mm)':
            if (value > 6) return 'Protrusive lower incisors. Normal: 4mm ± 2mm.';
            if (value < 2) return 'Retrusive lower incisors. Normal: 4mm ± 2mm.';
            return 'Normal lower incisor position. Normal: 4mm ± 2mm.';
          case 'Interincisal angle':
            if (value < 120) return 'Bimaxillary protrusion tendency. Normal: 130° ± 10°.';
            if (value > 140) return 'Upright incisors, deep bite tendency. Normal: 130° ± 10°.';
            return 'Normal interincisal relationship. Normal: 130° ± 10°.';
          case 'Occlusal plane angle':
            if (value > 19) return 'Steep occlusal plane. Normal: 14° ± 5°.';
            if (value < 9) return 'Flat occlusal plane. Normal: 14° ± 5°.';
            return 'Normal occlusal plane. Normal: 14° ± 5°.';
          
          // Downs
          case 'Facial Angle':
              if (value < 82) return 'Retrognathic profile. Normal: 87.8° ± 3.6°.';
              if (value > 95) return 'Prognathic profile. Normal: 87.8° ± 3.6°.';
              return 'Balanced facial profile. Normal: 87.8° ± 3.6°.';
          case 'Angle of Convexity':
              if (value > 10) return 'Marked skeletal convexity. Normal: 0° ± 5.1°.';
              if (value < -8.5) return 'Marked skeletal concavity. Normal: 0° ± 5.1°.';
              return 'Straight facial profile. Normal: 0° ± 5.1°.';
          case 'Downs Mandibular Plane':
              if (value > 28) return 'High angle (vertical growth). Normal: 21.9° ± 3.2°.';
              if (value < 17) return 'Low angle (horizontal growth). Normal: 21.9° ± 3.2°.';
              return 'Normal mandibular plane. Normal: 21.9° ± 3.2°.';
          case 'Y-Axis':
              if (value > 66) return 'Vertical growth tendency. Normal: 59.4° ± 3.8°.';
              if (value < 53) return 'Horizontal growth tendency. Normal: 59.4° ± 3.8°.';
              return 'Normal growth direction. Normal: 59.4° ± 3.8°.';
          case 'A-B Plane Angle':
              if (value > 0) return 'Class II jaw relationship. Normal: -4.6° ± 4.1°.';
              if (value < -9) return 'Class III jaw relationship. Normal: -4.6° ± 4.1°.';
              return 'Normal jaw relationship. Normal: -4.6° ± 4.1°.';
          case 'Cant of Occlusal plane':
            return 'Assesses vertical asymmetry. Normal is 9.3° ± 3.8°.';
          case 'Upper incisor to A-Pog Line (mm)':
            return 'Measures upper incisor protrusion. Normal: +2.7mm ± 1.8mm.';

          // Tweed's
          case 'FMA':
              if (value > 30) return 'High angle, vertical grower. Normal: 25° ± 5°.';
              if (value < 20) return 'Low angle, horizontal grower. Normal: 25° ± 5°.';
              return 'Normal growth pattern. Normal: 25° ± 5°.';
          case 'IMPA':
              if (value > 95) return 'Proclined lower incisors. Normal: 90° ± 5°.';
              if (value < 85) return 'Retroclined lower incisors. Normal: 90° ± 5°.';
              return 'Normal lower incisor position. Normal: 90° ± 5°.';
          case 'FMIA':
              if (value < 60) return 'Protrusive incisors. Normal: 65° ± 5°.';
              if (value > 70) return 'Upright incisors. Normal: 65° ± 5°.';
              return 'Balanced lower incisor position. Normal: 65° ± 5°.';
          
          // Rakosi
          case 'Saddle angle':
            return `Indicates cranial base flexure. Normal: 123° ± 5°. Value: ${value.toFixed(1)}°`;
          case 'Articulare angle':
            return `Relates jaw to cranial base. Normal: 143° ± 6°. Value: ${value.toFixed(1)}°`;
          case 'Gonial angle':
            return `Indicates mandibular growth direction. Normal: 128° ± 7°. Value: ${value.toFixed(1)}°`;
          case 'Facial axis angle (Rakosi)':
            return `Assesses mandibular growth direction. Normal: 90° ± 3°. Value: ${value.toFixed(1)}°`;
          case 'Mandibular body length':
            return `Indicates length of mandible. Normal varies. Value: ${value.toFixed(1)}mm`;
          case 'Posterior/anterior face height ratio':
            return `Assesses vertical facial balance. Normal: 65% ± 4%. Value: ${value.toFixed(1)}%`;
            
          // McNamara
          case 'Maxillary skeletal position (N perp to A)':
            return `Maxilla relative to face. Normal: 0mm. Value: ${value.toFixed(1)}mm`;
          case 'Mandibular position (N perp to Pog)':
            return `Mandible relative to face. Normal: -2mm to +2mm. Value: ${value.toFixed(1)}mm`;
          case 'Maxillomandibular difference':
            return `Difference between maxilla and mandible position. Varies. Value: ${value.toFixed(1)}mm`;
          case 'Mandibular plane angle (McNamara)':
            return `Assesses vertical dimension. Normal: 23° ± 4°. Value: ${value.toFixed(1)}°`;
          case 'Facial axis angle (McNamara)':
            return `Mandibular growth direction. Normal: 90° ± 3°. Value: ${value.toFixed(1)}°`;
          case 'Lower incisor protrusion':
            return `Lower incisor to A-Pog line. Normal: 1-3mm. Value: ${value.toFixed(1)}mm`;
          case 'Upper incisor protrusion':
            return `Upper incisor to A-Pog line. Normal varies. Value: ${value.toFixed(1)}mm`;

          // Ricketts
          case 'Facial Axis (Ricketts)':
            return `Growth direction indicator. Normal: 90° ± 3°.`;
          case 'Facial Depth (Ricketts)':
            return `Horizontal skeletal pattern. Normal: 87° ± 3°.`;
          case 'Mandibular Plane (Ricketts)':
            return `Vertical skeletal pattern. Normal: 26° ± 4°.`;
          case 'Convexity of Point A (Ricketts)':
            return `Anteroposterior jaw relationship. Normal: 2mm ± 2mm.`;
          case 'Lower Incisor to A-Pog (Ricketts)':
            return `Lower incisor protrusion. Normal: 1mm ± 2mm.`;

          // Wits
          case 'Wits Appraisal':
            if (value > 2) return `Class II skeletal tendency. Normal: -1mm to 1mm.`;
            if (value < -2) return `Class III skeletal tendency. Normal: -1mm to 1mm.`;
            return `Class I skeletal relationship. Normal: -1mm to 1mm.`;

          default:
            return 'Standard interpretation not available.';
        }
      };
      
      const newAnalysis: AnalysisCategory[] = [
        {
          name: 'Steiner’s Analysis',
          results: [
            { name: 'ANB', value: anbAngle, unit: '°', interpretation: getInterpretation('ANB', anbAngle) },
            { name: 'Interincisal angle', value: interincisalAngleSteiner, unit: '°', interpretation: getInterpretation('Interincisal angle', interincisalAngleSteiner) },
            { name: 'Lower incisor to NB Angle', value: l1NBAngle, unit: '°', interpretation: getInterpretation('Lower incisor to NB Angle', l1NBAngle) },
            { name: 'Lower incisor to NB Linear(mm)', value: l1NBDist, unit: 'mm', interpretation: getInterpretation('Lower incisor to NB Linear(mm)', l1NBDist) },
            { name: 'Mandibular plane Angle', value: snGoGnAngle, unit: '°', interpretation: getInterpretation('Mandibular plane Angle', snGoGnAngle) },
            { name: 'Occlusal plane angle', value: occlusalPlaneAngle, unit: '°', interpretation: getInterpretation('Occlusal plane angle', occlusalPlaneAngle) },
            { name: 'SNA', value: snaAngle, unit: '°', interpretation: getInterpretation('SNA', snaAngle) },
            { name: 'SNB', value: snbAngle, unit: '°', interpretation: getInterpretation('SNB', snbAngle) },
            { name: 'Upper incisor to NA Angle', value: u1NAAngle, unit: '°', interpretation: getInterpretation('Upper incisor to NA Angle', u1NAAngle) },
            { name: 'Upper incisor to NA Linear (mm)', value: u1NADist, unit: 'mm', interpretation: getInterpretation('Upper incisor to NA Linear (mm)', u1NADist) },
          ].sort((a,b) => a.name.localeCompare(b.name)),
        },
        {
          name: 'Downs Analysis',
          results: [
            { name: 'Facial Angle', value: facialAngle, unit: '°', interpretation: getInterpretation('Facial Angle', facialAngle) },
            { name: 'Angle of Convexity', value: angleOfConvexity, unit: '°', interpretation: getInterpretation('Angle of Convexity', angleOfConvexity) },
            { name: 'Downs Mandibular Plane', value: downsMandibularPlaneAngle, unit: '°', interpretation: getInterpretation('Downs Mandibular Plane', downsMandibularPlaneAngle) },
            { name: 'Y-Axis', value: yAxisAngle, unit: '°', interpretation: getInterpretation('Y-Axis', yAxisAngle) },
            { name: 'A-B Plane Angle', value: abPlaneAngle, unit: '°', interpretation: getInterpretation('A-B Plane Angle', abPlaneAngle) },
            { name: 'Cant of Occlusal plane', value: cantOfOcclusalPlane, unit: '°', interpretation: getInterpretation('Cant of Occlusal plane', cantOfOcclusalPlane) },
            { name: 'Upper incisor to A-Pog Line (mm)', value: upperIncisorToAPog, unit: 'mm', interpretation: getInterpretation('Upper incisor to A-Pog Line (mm)', upperIncisorToAPog) },
          ].sort((a,b) => a.name.localeCompare(b.name)),
        },
        {
          name: 'Tweed’s Analysis',
          results: [
            { name: 'FMA', value: fmaAngle, unit: '°', interpretation: getInterpretation('FMA', fmaAngle) },
            { name: 'IMPA', value: impaAngle, unit: '°', interpretation: getInterpretation('IMPA', impaAngle) },
            { name: 'FMIA', value: fmiaAngle, unit: '°', interpretation: getInterpretation('FMIA', fmiaAngle) },
          ].sort((a,b) => a.name.localeCompare(b.name)),
        },
        {
          name: 'Rakosi Analysis',
          results: [
            { name: 'Saddle angle', value: saddleAngle, unit: '°', interpretation: getInterpretation('Saddle angle', saddleAngle) },
            { name: 'Articulare angle', value: articulareAngle, unit: '°', interpretation: getInterpretation('Articulare angle', articulareAngle) },
            { name: 'Gonial angle', value: gonialAngle, unit: '°', interpretation: getInterpretation('Gonial angle', gonialAngle) },
            { name: 'Facial axis angle (Rakosi)', value: facialAxisAngleRakosi, unit: '°', interpretation: getInterpretation('Facial axis angle (Rakosi)', facialAxisAngleRakosi) },
            { name: 'Mandibular body length', value: mandibularBodyLength, unit: 'mm', interpretation: getInterpretation('Mandibular body length', mandibularBodyLength) },
            { name: 'Posterior/anterior face height ratio', value: posteriorAnteriorFaceHeightRatio, unit: '%', interpretation: getInterpretation('Posterior/anterior face height ratio', posteriorAnteriorFaceHeightRatio) },
          ].sort((a,b) => a.name.localeCompare(b.name)),
        },
        {
          name: 'McNamara’s Analysis',
          results: [
            { name: 'Maxillary skeletal position (N perp to A)', value: maxillarySkeletalPosition, unit: 'mm', interpretation: getInterpretation('Maxillary skeletal position (N perp to A)', maxillarySkeletalPosition) },
            { name: 'Mandibular position (N perp to Pog)', value: mandibularPosition, unit: 'mm', interpretation: getInterpretation('Mandibular position (N perp to Pog)', mandibularPosition) },
            { name: 'Maxillomandibular difference', value: maxillomandibularDifference, unit: 'mm', interpretation: getInterpretation('Maxillomandibular difference', maxillomandibularDifference) },
            { name: 'Mandibular plane angle (McNamara)', value: mandibularPlaneAngleMcNamara, unit: '°', interpretation: getInterpretation('Mandibular plane angle (McNamara)', mandibularPlaneAngleMcNamara) },
            { name: 'Facial axis angle (McNamara)', value: facialAxisAngleMcNamara, unit: '°', interpretation: getInterpretation('Facial axis angle (McNamara)', facialAxisAngleMcNamara) },
            { name: 'Lower incisor protrusion', value: lowerIncisorProtrusion, unit: 'mm', interpretation: getInterpretation('Lower incisor protrusion', lowerIncisorProtrusion) },
            { name: 'Upper incisor protrusion', value: upperIncisorProtrusion, unit: 'mm', interpretation: getInterpretation('Upper incisor protrusion', upperIncisorProtrusion) },
          ].sort((a,b) => a.name.localeCompare(b.name)),
        },
        {
            name: 'Ricketts Analysis',
            results: [
                { name: 'Facial Axis (Ricketts)', value: rickettsFacialAxis, unit: '°', interpretation: getInterpretation('Facial Axis (Ricketts)', rickettsFacialAxis) },
                { name: 'Facial Depth (Ricketts)', value: rickettsFacialDepth, unit: '°', interpretation: getInterpretation('Facial Depth (Ricketts)', rickettsFacialDepth) },
                { name: 'Mandibular Plane (Ricketts)', value: rickettsMandibularPlane, unit: '°', interpretation: getInterpretation('Mandibular Plane (Ricketts)', rickettsMandibularPlane) },
                { name: 'Convexity of Point A (Ricketts)', value: rickettsConvexity, unit: 'mm', interpretation: getInterpretation('Convexity of Point A (Ricketts)', rickettsConvexity) },
                { name: 'Lower Incisor to A-Pog (Ricketts)', value: rickettsLowerIncisor, unit: 'mm', interpretation: getInterpretation('Lower Incisor to A-Pog (Ricketts)', rickettsLowerIncisor) },
            ].sort((a,b) => a.name.localeCompare(b.name)),
        },
        {
            name: 'Wits Appraisal',
            results: [
                { name: 'Wits Appraisal', value: signedWitsValue, unit: 'mm', interpretation: getInterpretation('Wits Appraisal', signedWitsValue) },
            ],
        },
      ];
      
      if (userDocRef) {
        await updateDoc(userDocRef, { analysisCount: increment(1) });
      }
      setAnalysis(newAnalysis.filter(cat => cat.results.length > 0));
      toast({ title: 'Analysis Complete', description: 'Cephalometric measurements have been calculated.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to calculate angles. ${error instanceof Error ? error.message : ''}`,
      });
    }
  };
  
  const handleExport = (type: 'image' | 'csv' | 'report') => {
    if (!image) return;
    const placedLandmarks = landmarks.filter(l => l.x !== null && l.y !== null);

    if (type === 'image') {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const img = document.createElement('img');
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            placedLandmarks.forEach(l => {
                if(l.x === null || l.y === null) return;
                ctx.beginPath();
                ctx.arc(l.x, l.y, 10, 0, 2 * Math.PI);
                ctx.fillStyle = 'hsl(var(--accent))';
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
            const link = document.createElement('a');
            link.download = 'cephalogram-analysis.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        img.src = image.src;
    } else if (type === 'csv') {
        let csvContent = "data:text/csv;charset=utf-8,Landmark,X,Y\n";
        placedLandmarks.forEach(l => {
            csvContent += `${l.name},${l.x},${l.y}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "landmarks.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (type === 'report') {
        window.print();
    }
  };

  const sidebarProps = {
    handleFileSelect,
    handleDetectLandmarks,
    isDetecting,
    image,
    landmarks,
    selectedLandmarkId,
    setSelectedLandmarkId,
    hoveredLandmark,
    setHoveredLandmark,
    handleGenerateReportClick,
    allLandmarksPlaced,
    analysis,
    hoveredAnalysis,
    setHoveredAnalysis,
    handleExport,
    fileInputRef,
    handleFileUpload,
    subscriptionStatus: userData?.subscriptionStatus,
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans">
      <header className="flex items-center justify-between p-2 md:p-3 border-b no-print">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-headline hidden md:block">
              Ceph Studio
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
           <Button variant="ghost" size="icon" onClick={() => handleManualZoom('in')}><ZoomIn className="w-5 h-5"/></Button>
           <Button variant="ghost" size="icon" onClick={() => handleManualZoom('out')}><ZoomOut className="w-5 h-5"/></Button>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <BookOpen className="w-5 h-5"/>
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Educational Resources</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                        <EducationalResources />
                    </div>
                </SheetContent>
            </Sheet>
            
            {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                
                 <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-2 text-xs">
                      <Crown className="w-4 h-4 text-primary" />
                      <span>{getSubscriptionPlanName(userData?.subscriptionStatus)}</span>
                    </div>
                  </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <UserIcon className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}

            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5"/>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                   <SheetHeader>
                        <SheetTitle className="sr-only">Main Menu</SheetTitle>
                   </SheetHeader>
                  <SidebarContent {...sidebarProps} />
                </SheetContent>
              </Sheet>
            )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {!isMobile && (
          <aside className="w-[350px] border-r flex-col no-print hidden md:flex">
             <SidebarContent {...sidebarProps} />
          </aside>
        )}

        <main className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900/50 p-4 relative overflow-hidden"
              onWheel={handleZoom}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              ref={imageViewerRef}>

          <SubscriptionDialog 
            open={showSubscriptionDialog}
            onOpenChange={setShowSubscriptionDialog}
            onSubscribe={handleSubscribe}
          />

          {!image && (
            <div className="text-center text-muted-foreground p-4">
              <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" />
              <p className="text-lg md:text-xl font-medium">Upload a cephalogram to begin</p>
              <p className="text-sm md:text-base">Supports PNG and JPG formats.</p>
            </div>
          )}
          
          {image && (
             <div
                ref={transformContainerRef}
                className="absolute origin-top-left"
                style={{
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                  transform: `translate(${viewTransform.pan.x}px, ${viewTransform.pan.y}px) scale(${viewTransform.scale})`,
                  cursor: isPanning ? 'grabbing' : (selectedLandmarkId ? 'crosshair' : 'grab')
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    if (e.button === 0) {
                        if(!draggedLandmark) setIsPanning(true);
                    }
                }}
                onClick={handlePlacementClick}
              >
                <Image
                    src={image.src}
                    alt="Cephalogram"
                    width={image.naturalWidth}
                    height={image.naturalHeight}
                    className="w-full h-full block"
                    draggable={false}
                />
                
                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${image.naturalWidth} ${image.naturalHeight}`}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {hoveredAnalysis && analysisLineMap[hoveredAnalysis] && analysisLineMap[hoveredAnalysis].map(([p1Id, p2Id], index) => {
                        const p1 = landmarks.find(l => l.id === p1Id);
                        const p2 = landmarks.find(l => l.id === p2Id);
                        if (p1 && p1.x !== null && p1.y !== null && p2 && p2.x !== null && p2.y !== null) {
                            return (
                                <line
                                    key={`${p1Id}-${p2Id}-${index}`}
                                    x1={p1.x}
                                    y1={p1.y}
                                    x2={p2.x}
                                    y2={p2.y}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2 / viewTransform.scale}
                                    strokeOpacity={0.8}
                                />
                            );
                        }
                        return null;
                    })}
                </svg>

                {landmarks.filter(l => l.x !== null && l.y !== null).map(l => (
                    <div key={l.id}
                        data-landmark-id={l.id}
                        onMouseEnter={() => setHoveredLandmark(l.id)}
                        onMouseLeave={() => setHoveredLandmark(null)}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                             if (e.button === 0) {
                                setDraggedLandmark(l.id);
                                setIsPanning(false);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute w-2 h-2 rounded-full cursor-pointer transition-transform duration-150 group"
                        style={{
                            left: `${l.x}px`,
                            top: `${l.y}px`,
                            backgroundColor: 'hsl(var(--accent))',
                            boxShadow: `0 0 0 ${1 / viewTransform.scale}px hsl(var(--background)), 0 0 0 ${2 / viewTransform.scale}px hsl(var(--accent))`,
                            transform: `translate(-50%, -50%) scale(${hoveredLandmark === l.id || draggedLandmark === l.id ? 1.5 : 1})`,
                            zIndex: draggedLandmark === l.id ? 10 : 5,
                        }}
                    >
                         <div
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ transform: `translate(-50%, 0) scale(${1 / viewTransform.scale})` }}
                         >
                            {l.name}
                        </div>
                    </div>
                ))}
             </div>
          )}
        </main>
      </div>
          <div className="print-only hidden">
          <h1 className="text-2xl font-bold mb-4">Cephalometric Analysis Report</h1>
          {analysis ? (
             <div id="report-content" className="p-2 mt-4 border rounded-md print-analysis">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measurement</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Interpretation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.flatMap(c => c.results).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.value.toFixed(1)}{item.unit}</TableCell>
                      <TableCell>{item.interpretation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div id="report-content" className="p-2 mt-4 border rounded-md print-analysis">
            <p>No analysis available to print.</p>
            </div>
          )}
          </div>
    </div>
  );
}
