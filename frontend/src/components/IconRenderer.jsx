import {
  Folder, BarChart3, FileText, Briefcase, Target,
  Wrench, Settings, Package, Home, Globe, Laptop,
  Smartphone, Palette, Microscope, BookOpen, GraduationCap,
  Lightbulb, Rocket, Star, Flame, Gem, Tent, Trophy
} from 'lucide-react';

const iconMap = {
  Folder,
  BarChart3,
  FileText,
  Briefcase,
  Target,
  Wrench,
  Settings,
  Package,
  Home,
  Globe,
  Laptop,
  Smartphone,
  Palette,
  Microscope,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Rocket,
  Star,
  Flame,
  Gem,
  Tent,
  Trophy
};

export default function IconRenderer({ iconName, size = 20, className = '' }) {
  const Icon = iconMap[iconName] || Globe;
  return <Icon size={size} className={className} />;
}
