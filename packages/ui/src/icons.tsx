"use client";

import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from "react";
import {
  Activity as SaxActivity,
  Add as SaxAdd,
  ArrowDown as SaxArrowDown,
  ArrowDown2 as SaxArrowDown2,
  ArrowForward as SaxArrowForward,
  ArrowLeft as SaxArrowLeft,
  ArrowLeft2 as SaxArrowLeft2,
  ArrowRight as SaxArrowRight,
  ArrowRight2 as SaxArrowRight2,
  ArrowUp as SaxArrowUp,
  ArrowUp2 as SaxArrowUp2,
  AttachCircle as SaxAttachCircle,
  Backward as SaxBackward,
  Briefcase as SaxBriefcase,
  Buildings2 as SaxBuildings2,
  Calendar as SaxCalendar,
  Calendar1 as SaxCalendar1,
  CalendarAdd as SaxCalendarAdd,
  CalendarTick as SaxCalendarTick,
  Call as SaxCall,
  Camera as SaxCamera,
  Card as SaxCard,
  Category as SaxCategory,
  Chart2 as SaxChart2,
  ChartSuccess as SaxChartSuccess,
  Clock as SaxClock,
  CloseCircle as SaxCloseCircle,
  CloseSquare as SaxCloseSquare,
  ColorSwatch as SaxColorSwatch,
  Copy as SaxCopy,
  Cup as SaxCup,
  DirectInbox as SaxDirectInbox,
  Discover as SaxDiscover,
  DocumentDownload as SaxDocumentDownload,
  DocumentText as SaxDocumentText,
  Edit2 as SaxEdit2,
  EmojiHappy as SaxEmojiHappy,
  EmojiNormal as SaxEmojiNormal,
  EmojiSad as SaxEmojiSad,
  ExportSquare as SaxExportSquare,
  Eye as SaxEye,
  EyeSlash as SaxEyeSlash,
  Facebook as SaxFacebook,
  Flash as SaxFlash,
  Forbidden2 as SaxForbidden2,
  Forward as SaxForward,
  Gallery as SaxGallery,
  GalleryAdd as SaxGalleryAdd,
  Gift as SaxGift,
  Global as SaxGlobal,
  Gps as SaxGps,
  HambergerMenu as SaxHambergerMenu,
  Heart as SaxHeart,
  HeartTick as SaxHeartTick,
  Hierarchy as SaxHierarchy,
  Hierarchy2 as SaxHierarchy2,
  Home2 as SaxHome2,
  InfoCircle as SaxInfoCircle,
  Instagram as SaxInstagram,
  Key as SaxKey,
  LampOn as SaxLampOn,
  Layer as SaxLayer,
  Link as SaxLink,
  LinkSquare as SaxLinkSquare,
  Location as SaxLocation,
  LocationSlash as SaxLocationSlash,
  LocationTick as SaxLocationTick,
  Lock as SaxLock,
  Lock1 as SaxLock1,
  Login as SaxLogin,
  Logout as SaxLogout,
  MagicStar as SaxMagicStar,
  MedalStar as SaxMedalStar,
  MessageAdd as SaxMessageAdd,
  MessageCircle as SaxMessageCircle,
  MessageFavorite as SaxMessageFavorite,
  MessageSquare as SaxMessageSquare,
  Minus as SaxMinus,
  Monitor as SaxMonitor,
  More as SaxMore,
  Mouse as SaxMouse,
  Notification as SaxNotification,
  People as SaxPeople,
  Profile2User as SaxProfile2User,
  Refresh as SaxRefresh,
  Ruler as SaxRuler,
  Routing as SaxRouting,
  SearchNormal1 as SaxSearchNormal1,
  SearchStatus as SaxSearchStatus,
  Send2 as SaxSend2,
  Setting2 as SaxSetting2,
  Share as SaxShare,
  Shield as SaxShield,
  ShieldCross as SaxShieldCross,
  ShieldSearch as SaxShieldSearch,
  ShieldTick as SaxShieldTick,
  SidebarLeft as SaxSidebarLeft,
  SidebarRight as SaxSidebarRight,
  Sms as SaxSms,
  SmsEdit as SaxSmsEdit,
  SmsTracking as SaxSmsTracking,
  Sticker as SaxSticker,
  TickCircle as SaxTickCircle,
  Timer as SaxTimer,
  Trash as SaxTrash,
  User as SaxUser,
  UserAdd as SaxUserAdd,
  UserSearch as SaxUserSearch,
  UserTick as SaxUserTick,
  Verify as SaxVerify,
  Video as SaxVideo,
  Warning2 as SaxWarning2,
  Weight as SaxWeight,
  type Icon, type IconProps,
} from "iconsax-react";

export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

/** Iconsax glyphs inherit the existing control color and SVG sizing classes. */
function adapt(Glyph: Icon, name: string): IconComponent {
  const Component = forwardRef<SVGSVGElement, IconProps>((props, ref) => <Glyph size={24} color="currentColor" variant="Linear" {...props} ref={ref} />);
  Component.displayName = name;
  return Component;
}

export const Activity = adapt(SaxActivity, "Activity");
export const AlertCircle = adapt(SaxInfoCircle, "AlertCircle");
export const AlertTriangle = adapt(SaxWarning2, "AlertTriangle");
export const ArrowDown = adapt(SaxArrowDown, "ArrowDown");
export const ArrowDownRight = adapt(SaxArrowDown, "ArrowDownRight");
export const ArrowLeft = adapt(SaxArrowLeft, "ArrowLeft");
export const ArrowRight = adapt(SaxArrowRight, "ArrowRight");
export const ArrowUp = adapt(SaxArrowUp, "ArrowUp");
export const ArrowUpRight = adapt(SaxArrowUp, "ArrowUpRight");
export const BadgeCheck = adapt(SaxVerify, "BadgeCheck");
export const Ban = adapt(SaxForbidden2, "Ban");
export const Bell = adapt(SaxNotification, "Bell");
export const Briefcase = adapt(SaxBriefcase, "Briefcase");
export const Building2 = adapt(SaxBuildings2, "Building2");
export const Calendar = adapt(SaxCalendar, "Calendar");
export const CalendarCheck2 = adapt(SaxCalendarTick, "CalendarCheck2");
export const CalendarClock = adapt(SaxCalendar1, "CalendarClock");
export const CalendarDays = adapt(SaxCalendar, "CalendarDays");
export const CalendarPlus = adapt(SaxCalendarAdd, "CalendarPlus");
export const Camera = adapt(SaxCamera, "Camera");
export const Check = adapt(SaxTickCircle, "Check");
export const CheckCheck = adapt(SaxTickCircle, "CheckCheck");
export const CheckCircle2 = adapt(SaxTickCircle, "CheckCircle2");
export const ChevronDown = adapt(SaxArrowDown2, "ChevronDown");
export const ChevronLeft = adapt(SaxArrowLeft2, "ChevronLeft");
export const ChevronRight = adapt(SaxArrowRight2, "ChevronRight");
export const ChevronUp = adapt(SaxArrowUp2, "ChevronUp");
export const ChevronsLeft = adapt(SaxBackward, "ChevronsLeft");
export const ChevronsRight = adapt(SaxForward, "ChevronsRight");
export const CircleCheck = adapt(SaxTickCircle, "CircleCheck");
export const Clock = adapt(SaxClock, "Clock");
export const Compass = adapt(SaxDiscover, "Compass");
export const Copy = adapt(SaxCopy, "Copy");
export const CornerDownLeft = adapt(SaxArrowForward, "CornerDownLeft");
export const CornerDownRight = adapt(SaxArrowForward, "CornerDownRight");
export const CreditCard = adapt(SaxCard, "CreditCard");
export const Download = adapt(SaxDocumentDownload, "Download");
export const Edit2 = adapt(SaxEdit2, "Edit2");
export const ExternalLink = adapt(SaxExportSquare, "ExternalLink");
export const Eye = adapt(SaxEye, "Eye");
export const EyeOff = adapt(SaxEyeSlash, "EyeOff");
export const Facebook = adapt(SaxFacebook, "Facebook");
export const Flame = adapt(SaxFlash, "Flame");
export const Gift = adapt(SaxGift, "Gift");
export const GitBranch = adapt(SaxHierarchy, "GitBranch");
export const Globe = adapt(SaxGlobal, "Globe");
export const Globe2 = adapt(SaxGlobal, "Globe2");
export const GripVertical = adapt(SaxMore, "GripVertical");
export const Heart = adapt(SaxHeart, "Heart");
export const HeartPulse = adapt(SaxHeartTick, "HeartPulse");
export const History = adapt(SaxClock, "History");
export const Home = adapt(SaxHome2, "Home");
export const Hourglass = adapt(SaxTimer, "Hourglass");
export const ImageIcon = adapt(SaxGallery, "ImageIcon");
export const ImagePlus = adapt(SaxGalleryAdd, "ImagePlus");
export const Inbox = adapt(SaxDirectInbox, "Inbox");
export const Instagram = adapt(SaxInstagram, "Instagram");
export const KeyRound = adapt(SaxKey, "KeyRound");
export const Layers = adapt(SaxLayer, "Layers");
export const LayoutDashboard = adapt(SaxCategory, "LayoutDashboard");
export const Lightbulb = adapt(SaxLampOn, "Lightbulb");
export const LineChart = adapt(SaxChart2, "LineChart");
export const Link = adapt(SaxLink, "Link");
export const Linkedin = adapt(SaxLinkSquare, "Linkedin");
export const Loader2 = adapt(SaxRefresh, "Loader2");
export const LoaderCircle = adapt(SaxRefresh, "LoaderCircle");
export const Lock = adapt(SaxLock, "Lock");
export const LockKeyhole = adapt(SaxLock1, "LockKeyhole");
export const LogIn = adapt(SaxLogin, "LogIn");
export const LogOut = adapt(SaxLogout, "LogOut");
export const Mail = adapt(SaxSms, "Mail");
export const MailCheck = adapt(SaxSmsTracking, "MailCheck");
export const MailPlus = adapt(SaxSmsEdit, "MailPlus");
export const MapPin = adapt(SaxLocation, "MapPin");
export const Medal = adapt(SaxMedalStar, "Medal");
export const Menu = adapt(SaxHambergerMenu, "Menu");
export const MessageCircle = adapt(SaxMessageCircle, "MessageCircle");
export const MessageCirclePlus = adapt(SaxMessageAdd, "MessageCirclePlus");
export const MessageSquare = adapt(SaxMessageSquare, "MessageSquare");
export const MessageSquareHeart = adapt(SaxMessageFavorite, "MessageSquareHeart");
export const Minus = adapt(SaxMinus, "Minus");
export const Monitor = adapt(SaxMonitor, "Monitor");
export const MoreHorizontal = adapt(SaxMore, "MoreHorizontal");
export const MousePointerClick = adapt(SaxMouse, "MousePointerClick");
export const Network = adapt(SaxHierarchy2, "Network");
export const Palette = adapt(SaxColorSwatch, "Palette");
export const PanelLeftClose = adapt(SaxSidebarLeft, "PanelLeftClose");
export const PanelLeftOpen = adapt(SaxSidebarRight, "PanelLeftOpen");
export const Paperclip = adapt(SaxAttachCircle, "Paperclip");
export const Pencil = adapt(SaxEdit2, "Pencil");
export const Phone = adapt(SaxCall, "Phone");
export const Pin = adapt(SaxLocationTick, "Pin");
export const PinOff = adapt(SaxLocationSlash, "PinOff");
export const Plus = adapt(SaxAdd, "Plus");
export const RefreshCw = adapt(SaxRefresh, "RefreshCw");
export const Rocket = adapt(SaxSend2, "Rocket");
export const ScrollText = adapt(SaxDocumentText, "ScrollText");
export const Search = adapt(SaxSearchNormal1, "Search");
export const SearchX = adapt(SaxSearchStatus, "SearchX");
export const Send = adapt(SaxSend2, "Send");
export const Settings = adapt(SaxSetting2, "Settings");
export const Settings2 = adapt(SaxSetting2, "Settings2");
export const Share2 = adapt(SaxShare, "Share2");
export const Shield = adapt(SaxShield, "Shield");
export const ShieldAlert = adapt(SaxShieldSearch, "ShieldAlert");
export const ShieldCheck = adapt(SaxShieldTick, "ShieldCheck");
export const ShieldOff = adapt(SaxShieldCross, "ShieldOff");
export const Smile = adapt(SaxEmojiHappy, "Smile");
export const SmileNeutral = adapt(SaxEmojiNormal, "SmileNeutral");
export const SmileSad = adapt(SaxEmojiSad, "SmileSad");
export const Ruler = adapt(SaxRuler, "Ruler");
export const Route = adapt(SaxRouting, "Route");
export const Dumbbell = adapt(SaxWeight, "Dumbbell");
export const Sparkles = adapt(SaxMagicStar, "Sparkles");
export const Sticker = adapt(SaxSticker, "Sticker");
export const Target = adapt(SaxGps, "Target");
export const Trash2 = adapt(SaxTrash, "Trash2");
export const TrendingUp = adapt(SaxChartSuccess, "TrendingUp");
export const Trophy = adapt(SaxCup, "Trophy");
export const User = adapt(SaxUser, "User");
export const UserCheck = adapt(SaxUserTick, "UserCheck");
export const UserPlus = adapt(SaxUserAdd, "UserPlus");
export const UserRound = adapt(SaxUser, "UserRound");
export const UserSearch = adapt(SaxUserSearch, "UserSearch");
export const Users = adapt(SaxProfile2User, "Users");
export const UsersRound = adapt(SaxPeople, "UsersRound");
export const Video = adapt(SaxVideo, "Video");
export const X = adapt(SaxCloseSquare, "X");
export const XCircle = adapt(SaxCloseCircle, "XCircle");
