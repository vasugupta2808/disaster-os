"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { 
  Droplets, Heart, Wrench, FileText, Shirt, Radio, Baby, 
  Share2, RotateCcw, ChevronDown, Plus, Minus, Check
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Tilt from "react-parallax-tilt";


type Priority = "essential" | "recommended" | "optional";

interface KitItem {
  id: string;
  name: string;
  baseQuantity: string;
  priority: Priority;
  scaleQuantity?: boolean;
}

interface KitCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  items: KitItem[];
}

const CATEGORIES: KitCategory[] = [
  {
    id: "water-food",
    name: "Water & Food",
    icon: <Droplets className="w-5 h-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    items: [
      { id: "wf-1", name: "Water", baseQuantity: "1 gallon/person/day for 3 days", priority: "essential", scaleQuantity: true },
      { id: "wf-2", name: "Non-perishable food", baseQuantity: "3-day supply", priority: "essential", scaleQuantity: true },
      { id: "wf-3", name: "Manual can opener", baseQuantity: "1 per kit", priority: "essential" },
      { id: "wf-4", name: "Water purification tablets", baseQuantity: "1 bottle", priority: "recommended" },
      { id: "wf-5", name: "Energy bars", baseQuantity: "6 bars/person", priority: "recommended", scaleQuantity: true },
      { id: "wf-6", name: "Electrolyte packets", baseQuantity: "3 packets/person", priority: "optional", scaleQuantity: true },
    ]
  },
  {
    id: "first-aid",
    name: "First Aid",
    icon: <Heart className="w-5 h-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    items: [
      { id: "fa-1", name: "First aid kit", baseQuantity: "1 comprehensive kit", priority: "essential" },
      { id: "fa-2", name: "Prescription medications", baseQuantity: "7-day supply", priority: "essential", scaleQuantity: true },
      { id: "fa-3", name: "Over-the-counter medicines", baseQuantity: "Assorted", priority: "recommended" },
      { id: "fa-4", name: "Bandages and gauze", baseQuantity: "Extra supply", priority: "recommended" },
      { id: "fa-5", name: "Antiseptic wipes", baseQuantity: "1 pack", priority: "essential" },
      { id: "fa-6", name: "Thermometer", baseQuantity: "1", priority: "recommended" },
      { id: "fa-7", name: "Tweezers", baseQuantity: "1 pair", priority: "optional" },
    ]
  },
  {
    id: "tools-safety",
    name: "Tools & Safety",
    icon: <Wrench className="w-5 h-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    items: [
      { id: "ts-1", name: "Flashlight + extra batteries", baseQuantity: "1 per person", priority: "essential", scaleQuantity: true },
      { id: "ts-2", name: "Multi-tool/Swiss army knife", baseQuantity: "1 per kit", priority: "essential" },
      { id: "ts-3", name: "Whistle", baseQuantity: "1 per person", priority: "essential", scaleQuantity: true },
      { id: "ts-4", name: "Dust masks/N95", baseQuantity: "2 per person", priority: "recommended", scaleQuantity: true },
      { id: "ts-5", name: "Duct tape", baseQuantity: "1 roll", priority: "recommended" },
      { id: "ts-6", name: "Plastic sheeting", baseQuantity: "1 roll", priority: "recommended" },
      { id: "ts-7", name: "Fire extinguisher", baseQuantity: "1 portable", priority: "essential" },
      { id: "ts-8", name: "Matches/lighter in waterproof container", baseQuantity: "1 set", priority: "recommended" },
    ]
  },
  {
    id: "documents",
    name: "Documents",
    icon: <FileText className="w-5 h-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    items: [
      { id: "doc-1", name: "ID copies (in waterproof bag)", baseQuantity: "All family members", priority: "essential" },
      { id: "doc-2", name: "Insurance documents", baseQuantity: "Policy copies", priority: "essential" },
      { id: "doc-3", name: "Bank account records", baseQuantity: "Recent statements", priority: "recommended" },
      { id: "doc-4", name: "Emergency contact list", baseQuantity: "Printed list", priority: "essential" },
      { id: "doc-5", name: "Medical records", baseQuantity: "Key records", priority: "recommended" },
      { id: "doc-6", name: "Cash (small bills + coins)", baseQuantity: "$100-$200", priority: "essential" },
      { id: "doc-7", name: "Maps of local area", baseQuantity: "1 physical map", priority: "optional" },
    ]
  },
  {
    id: "clothing-shelter",
    name: "Clothing & Shelter",
    icon: <Shirt className="w-5 h-5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    items: [
      { id: "cs-1", name: "Change of clothes", baseQuantity: "1 set per person", priority: "essential", scaleQuantity: true },
      { id: "cs-2", name: "Sturdy shoes", baseQuantity: "1 pair per person", priority: "essential", scaleQuantity: true },
      { id: "cs-3", name: "Rain gear", baseQuantity: "1 per person", priority: "recommended", scaleQuantity: true },
      { id: "cs-4", name: "Blankets or sleeping bags", baseQuantity: "1 per person", priority: "essential", scaleQuantity: true },
      { id: "cs-5", name: "Emergency mylar blankets", baseQuantity: "1 per person", priority: "recommended", scaleQuantity: true },
      { id: "cs-6", name: "Tent or tarp", baseQuantity: "1 per kit", priority: "optional" },
    ]
  },
  {
    id: "communication",
    name: "Communication",
    icon: <Radio className="w-5 h-5" />,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    items: [
      { id: "com-1", name: "Battery/hand-crank radio", baseQuantity: "1", priority: "essential" },
      { id: "com-2", name: "Fully charged power bank", baseQuantity: "1-2 large capacity", priority: "essential" },
      { id: "com-3", name: "Phone charger + cables", baseQuantity: "1 set per device type", priority: "essential" },
      { id: "com-4", name: "Emergency whistle", baseQuantity: "1 per person", priority: "essential", scaleQuantity: true },
      { id: "com-5", name: "Notepad and pen", baseQuantity: "1 set", priority: "recommended" },
      { id: "com-6", name: "List of emergency frequencies", baseQuantity: "1 printed sheet", priority: "optional" },
    ]
  },
  {
    id: "special-needs",
    name: "Special Needs",
    icon: <Baby className="w-5 h-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    items: [
      { id: "sn-1", name: "Baby supplies (formula/diapers)", baseQuantity: "3-day supply", priority: "essential" },
      { id: "sn-2", name: "Pet food and supplies", baseQuantity: "3-day supply per pet", priority: "essential" },
      { id: "sn-3", name: "Extra eyeglasses", baseQuantity: "1 pair", priority: "recommended" },
      { id: "sn-4", name: "Hearing aid batteries", baseQuantity: "Extra supply", priority: "essential" },
      { id: "sn-5", name: "Mobility device supplies", baseQuantity: "As needed", priority: "essential" },
      { id: "sn-6", name: "Comfort items for children", baseQuantity: "Small toys/books", priority: "optional" },
      { id: "sn-7", name: "Important family photos", baseQuantity: "Physical copies", priority: "optional" },
    ]
  }
];

const STORAGE_KEY_CHECKED = "disaster-os-kit-checked";
const STORAGE_KEY_FAMILY_SIZE = "disaster-os-kit-family-size";

export function EmergencyKit() {
  const [mounted, setMounted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [familySize, setFamilySize] = useState<number>(1);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "water-food": true
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    const storedChecked = localStorage.getItem(STORAGE_KEY_CHECKED);
    const storedFamilySize = localStorage.getItem(STORAGE_KEY_FAMILY_SIZE);
    
    if (storedChecked) {
      try {
        setCheckedItems(JSON.parse(storedChecked));
      } catch (e) {
        console.error("Failed to parse checked items", e);
      }
    }
    
    if (storedFamilySize) {
      const parsed = parseInt(storedFamilySize, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        setFamilySize(parsed);
      }
    }
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY_CHECKED, JSON.stringify(checkedItems));
    }
  }, [checkedItems, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY_FAMILY_SIZE, familySize.toString());
    }
  }, [familySize, mounted]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const adjustFamilySize = (delta: number) => {
    setFamilySize(prev => Math.min(Math.max(1, prev + delta), 10));
  };

  const resetAll = () => {
    setCheckedItems({});
    setResetDialogOpen(false);
    toast.success("Checklist reset successfully.");
  };

  const shareChecklist = async () => {
    let text = "Emergency Preparedness Checklist\n\n";
    
    CATEGORIES.forEach(category => {
      text += `${category.name}\n`;
      category.items.forEach(item => {
        const isChecked = checkedItems[item.id];
        const checkbox = isChecked ? "✅" : "⬜";
        const quantity = getQuantityText(item);
        text += `${checkbox} ${item.name} (${quantity})\n`;
      });
      text += "\n";
    });
    
    text += `Prepared for family of ${familySize} using Disaster OS.`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const getQuantityText = (item: KitItem) => {
    if (!item.scaleQuantity || familySize === 1) return item.baseQuantity;
    
    // Simplistic scaling for demonstration purposes
    let qty = item.baseQuantity;
    
    if (qty.includes("1 gallon/person/day for 3 days")) {
      return `${familySize} gallons/day for 3 days (${familySize * 3} gal total)`;
    }
    if (qty.includes("6 bars/person")) {
      return `${6 * familySize} bars total`;
    }
    if (qty.includes("3 packets/person")) {
      return `${3 * familySize} packets total`;
    }
    if (qty.includes("1 per person")) {
      return `${familySize} total`;
    }
    if (qty.includes("2 per person")) {
      return `${2 * familySize} total`;
    }
    if (qty.includes("1 set per person") || qty.includes("1 pair per person")) {
      return `${familySize} sets/pairs total`;
    }
    
    return qty;
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "essential":
        return <Badge variant="destructive" className="text-[10px] h-4 px-1.5 uppercase font-bold">Essential</Badge>;
      case "recommended":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] h-4 px-1.5 uppercase font-bold">Recommended</Badge>;
      case "optional":
        return <Badge variant="outline" className="text-blue-500 border-blue-200 text-[10px] h-4 px-1.5 uppercase font-bold">Optional</Badge>;
    }
  };

  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);
  
  const getProgressColor = (percentage: number) => {
    if (percentage < 33) return "bg-red-500";
    if (percentage < 66) return "bg-amber-500";
    return "bg-green-500";
  };

  if (!mounted) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Emergency Kit</h1>
          <p className="text-muted-foreground max-w-xl">
            Build and maintain your family's emergency survival kit. Keep these items in easy-to-carry containers ready to grab in case of evacuation.
          </p>
        </div>

        <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.02} transitionSpeed={2500}>
          <Card className="w-full md:w-auto shadow-sm">
            <CardContent className="p-4 flex items-center justify-between md:justify-start gap-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground block">Family Size</span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => adjustFamilySize(-1)}
                    disabled={familySize <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-bold w-4 text-center">{familySize}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => adjustFamilySize(1)}
                    disabled={familySize >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tilt>
      </div>

      <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={2500}>
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-lg">Overall Progress</span>
              <span className="font-bold text-lg">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-secondary" 
              indicatorClassName={getProgressColor(progressPercentage)}
            />
            <p className="text-sm text-muted-foreground mt-3">
              {checkedCount} of {totalItems} items packed and ready.
            </p>
          </CardContent>
        </Card>
      </Tilt>

      <div className="flex flex-wrap items-center gap-3">
        <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.04} transitionSpeed={2000}>
          <Button onClick={shareChecklist} variant="outline" className="gap-2 bg-background shadow-sm hover:bg-secondary">
            <Share2 className="w-4 h-4" />
            Share Checklist
          </Button>
        </Tilt>
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.04} transitionSpeed={2000}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-background shadow-sm">
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            </DialogTrigger>
          </Tilt>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Checklist?</DialogTitle>
              <DialogDescription>
                This will uncheck all items in your emergency kit. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={resetAll}>Yes, Reset All</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 pb-12">
        {CATEGORIES.map((category) => {
          const catCheckedCount = category.items.filter(item => checkedItems[item.id]).length;
          const isExpanded = expandedCategories[category.id];
          const isComplete = catCheckedCount === category.items.length;
          
          return (
            <Tilt key={category.id} tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.01} transitionSpeed={2500} className="w-full">
              <Card className="overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                <div 
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer select-none transition-colors",
                    isExpanded ? "bg-secondary/30 border-b" : "hover:bg-secondary/20",
                    isComplete && !isExpanded && "bg-green-500/5 hover:bg-green-500/10"
                  )}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl", category.bgColor, category.color)}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{category.name}</h3>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className={cn(isComplete && "text-green-600 font-medium")}>
                          {catCheckedCount} / {category.items.length} items
                        </span>
                        {isComplete && <Check className="w-3.5 h-3.5 text-green-600" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-32">
                      <Progress 
                        value={(catCheckedCount / category.items.length) * 100} 
                        className="h-2"
                        indicatorClassName={isComplete ? "bg-green-500" : category.color.replace("text-", "bg-")}
                      />
                    </div>
                    <ChevronDown 
                      className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} 
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-2 sm:p-4 grid gap-2">
                        {category.items.map((item) => {
                          const isChecked = !!checkedItems[item.id];
                          
                          return (
                            <div 
                              key={item.id}
                              className={cn(
                                "flex items-start sm:items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group",
                                isChecked ? "bg-secondary/50" : "hover:bg-secondary/30"
                              )}
                              onClick={() => toggleItem(item.id)}
                            >
                              <div className="pt-1 sm:pt-0">
                                <div className={cn(
                                  "w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200",
                                  isChecked 
                                    ? "bg-primary border-primary text-primary-foreground" 
                                    : "border-muted-foreground/30 group-hover:border-primary/50 bg-background"
                                )}>
                                  {isChecked && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                      <Check className="w-4 h-4" />
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "font-medium transition-colors duration-200 line-clamp-2",
                                    isChecked && "text-muted-foreground line-through decoration-muted-foreground/50"
                                  )}>
                                    {item.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {getQuantityText(item)}
                                  </span>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  {getPriorityBadge(item.priority)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </Tilt>
          );
        })}
      </div>
    </div>
  );
}
