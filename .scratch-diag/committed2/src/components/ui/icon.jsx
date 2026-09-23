import React, { forwardRef } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  BookMarked,
  BookOpen,
  BookOpenText,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChartLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Copy,
  Clock,
  Compass,
  Ellipsis,
  ExternalLink,
  Feather,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Languages,
  Layers,
  List,
  ListMusic,
  Loader2,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  Moon,
  Music,
  Pencil,
  PenLine,
  Palette,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  RotateCw,
  Search,
  Send,
  Settings,
  Share2,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  SpellCheck,
  Star,
  StepBack,
  StepForward,
  StickyNote,
  StopCircle,
  Sun,
  Type,
  Trash2,
  TriangleAlert,
  Wand2 as WandSparkles,
  AudioWaveform,
  Brain,
  UsersRound,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

/**
 * Icon component that renders Lucide React icons by name.
 *
 * Supports the legacy FontAwesome-style names used in the app, mapped to their
 * closest Lucide equivalents. Use this component going forward instead
 * of icon-font elements.
 *
 * @example
 *   <Icon name="search" size={16} />
 *   <Icon name="book-open" className="text-emerald-600" />
 *   <Icon name="spinner" spin />
 *   <Icon name="chevron-left" size={12} />
 */
const iconMap = {
  // Navigation / Arrows
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-up-right-from-square": ExternalLink,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "external-link": ExternalLink,

  // Actions
  "bookmark": BookMarked,
  "bolt": Zap,
  "copy": Copy,
  "ellipsis": Ellipsis,
  "ellipsis-h": Ellipsis,
  "ellipsis-v": Ellipsis,
  "heart": Heart,
  "pen": Pencil,
  "pen-to-square": PenLine,
  "pencil": Pencil,
  "play": Play,
  "plus": Plus,
  "repeat": Repeat,
  "refresh": RefreshCw,
  "rotate": RotateCw,
  "rotate-left": RotateCw,
  "rotate-right": RotateCw,
  "share-nodes": Share2,
  "share": Share2,
  "star": Star,
  "thumbtack": Pin,
  "pin": Pin,
  "trash": Trash2,
  "trash-alt": Trash2,
  "wand-magic-sparkles": WandSparkles,
  "magic": WandSparkles,
  "minus": Minus,

  // Status / Feedback
  "circle-exclamation": AlertCircle,
  "exclamation-circle": AlertCircle,
  "exclamation-triangle": TriangleAlert,
  "triangle-exclamation": TriangleAlert,
  "warning": TriangleAlert,
  "info-circle": AlertCircle,
  "spinner": Loader2,
  "circle-notch": Loader2,
  "check": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),

  // Media
  "backward-step": StepBack,
  "backward": StepBack,
  "compress": Minus,
  "forward-step": StepForward,
  "forward": StepForward,
  "music": Music,
  "pause": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  "sliders": SlidersHorizontal,
  "stop": StopCircle,
  "volume-up": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),

  // UI
  "close": X,
  "times": X,
  "xmark": X,
  "bars": Menu,
  "menu": Menu,
  "cog": Settings,
  "settings": Settings,
  "gear": Settings,

  // Content
  "book": BookOpenText,
  "book-open": BookOpen,
  "book-quran": BookOpenText,
  "quran": BookOpenText,
  "calendar": Calendar,
  "calendar-check": CalendarCheck,
  "calendar-day": CalendarDays,
  "chart-line": ChartLine,
  "clock": Clock,
  "clock-rotate-left": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  "compass": Compass,
  "envelope": Mail,
  "image": ImageIcon,
  "language": Languages,
  "layer-group": Layers,
  "list": List,
  "list-music": ListMusic,
  "list-ul": List,
  "graduation-cap": GraduationCap,
  "magnifying-glass": Search,
  "palette": Palette,
  "search": Search,
  "spell-check": SpellCheck,
  "brain": Brain,
  "shapes": Shapes,
  "users-between-lines": UsersRound,
  "user-music": Music,
  "wifi-slash": WifiOff,
  "feather": Feather,
  "sticky-note": StickyNote,
  "globe": Globe,
  "moon": Moon,
  "sun": Sun,
  "comment": MessageCircle,
  "file": FileText,
  "bold": Bold,
  "font": Type,
  "wave-square": AudioWaveform,

  // Brands (rendered as inline SVGs)
  "whatsapp": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  ),
  "telegram-plane": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.441-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.099.154.232.17.327.016.095.036.332.02.515z" />
    </svg>
  ),
  "x-twitter": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  "facebook": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.438H7.078v-3.489h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.489h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  ),

  // Misc
  "download": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  "circle": ({ className, size, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

const Icon = forwardRef(function Icon(
  { name, size = 16, className, spin = false, "aria-hidden": ariaHidden, ...rest },
  ref,
) {
  const nameTokens = String(name || "").trim().split(/\s+/);
  const legacyName = nameTokens.find(
    (token) => token.startsWith("fa-") && token !== "fa-spin",
  );
  const normalizedName = legacyName ? legacyName.slice(3) : name;
  const IconComponent = iconMap[normalizedName];
  const shouldSpin = spin || nameTokens.includes("fa-spin");

  if (!IconComponent) {
    return null;
  }

  if (typeof IconComponent === "function" && !IconComponent.displayName?.startsWith("Lucide")) {
    // Inline SVG component
    return (
      <IconComponent
        ref={ref}
        size={size}
        className={clsx(shouldSpin && "animate-spin", className)}
        aria-hidden={ariaHidden ?? true}
        {...rest}
      />
    );
  }

  return (
    <IconComponent
      ref={ref}
      size={size}
      className={clsx(shouldSpin && "animate-spin", className)}
      aria-hidden={ariaHidden ?? true}
      strokeWidth={1.5}
      {...rest}
    />
  );
});

export { Icon };
export default Icon;
