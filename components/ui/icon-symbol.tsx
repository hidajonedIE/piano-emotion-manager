// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for Piano Tech Manager
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "person.2.fill": "people",
  "person.fill": "person",
  "building.2.fill": "business",
  "pianokeys": "piano",
  "wrench.fill": "build",
  "gearshape.fill": "settings",
  
  // Actions
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "pencil": "edit",
  "trash.fill": "delete",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  
  // Communication
  "phone.fill": "phone",
  "envelope.fill": "email",
  "location.fill": "location-on",
  "map.fill": "map",
  
  // Content
  "doc.text.fill": "description",
  "calendar": "event",
  "clock.fill": "schedule",
  "bell.fill": "notifications",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  
  // Navigation arrows
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  
  // Search and filter
  "magnifyingglass": "search",
  "line.3.horizontal.decrease": "filter-list",
  "line.3.horizontal": "menu",
  
  // Status
  "star.fill": "star",
  "heart.fill": "favorite",
  "bookmark.fill": "bookmark",
  
  // Misc
  "doc.on.doc.fill": "content-copy",
  "bolt.fill": "flash-on",
  "square.grid.2x2.fill": "grid-view",
  "photo.fill": "photo",
  "camera.fill": "photo-camera",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  
  // Invoicing/Documents
  "doc.text": "article",
  "printer.fill": "print",
  "arrow.down.doc.fill": "download",
  "arrow.counterclockwise": "refresh",
  "circle": "radio-button-unchecked",
  "eurosign.circle.fill": "euro",
  "list.bullet": "list",
  "shippingbox.fill": "inventory",
  "chart.bar.fill": "bar-chart",
  "chart.pie.fill": "pie-chart",
  "person.badge.plus": "person-add",
  
  // Music/Piano specific
  "music.note": "music-note",
  "tuningfork": "tune",
  
  // Help
  "questionmark.circle.fill": "help",
  "book.fill": "menu-book",
  
  // Notifications & Calendar
  "calendar.badge.clock": "event-available",
  "wrench.and.screwdriver.fill": "handyman",
  "folder.fill": "folder",
  "arrow.clockwise.icloud.fill": "cloud-sync",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] || "help-outline";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
