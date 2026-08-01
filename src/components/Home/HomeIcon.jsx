import {
  Bookmark,
  CloudMoon,
  CloudSun,
  Flame,
  Infinity as InfinityIcon,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  Mic2,
  Moon,
  MoonStar,
  Mountain,
  PenLine,
  Repeat,
  Search,
  ShieldHalf,
  Star,
  StickyNote,
  Sun,
  UserRound,
} from "lucide-react";
import { clsx } from "clsx";

const homeIconMap = {
  bookmark: Bookmark,
  "cloud-moon": CloudMoon,
  "cloud-sun": CloudSun,
  fire: Flame,
  infinity: InfinityIcon,
  "layer-group": Layers,
  leaf: Leaf,
  lightbulb: Lightbulb,
  "magnifying-glass": Search,
  "microphone-lines": Mic2,
  moon: Moon,
  mosque: Landmark,
  "mountain-sun": Mountain,
  "note-sticky": StickyNote,
  "pen-line": PenLine,
  repeat: Repeat,
  "shield-halved": ShieldHalf,
  star: Star,
  "star-and-crescent": MoonStar,
  sun: Sun,
  "user-astronaut": UserRound,
};

export default function HomeIcon({
  name,
  size = 16,
  className,
  "aria-hidden": ariaHidden,
  ...props
}) {
  const normalizedName = String(name || "")
    .trim()
    .split(/\s+/)
    .find((token) => token.startsWith("fa-"))
    ?.slice(3) || name;
  const IconComponent = homeIconMap[normalizedName];
  if (!IconComponent) return null;

  return (
    <IconComponent
      size={size}
      strokeWidth={1.5}
      className={clsx(className)}
      aria-hidden={ariaHidden ?? true}
      {...props}
    />
  );
}
