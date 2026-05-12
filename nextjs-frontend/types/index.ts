// ── Core domain types ─────────────────────────────────────────────────────────

export interface User {
  id: number;
  userId?: number;
  name: string;
  email: string;
  phone?: string;
  role: "buyer" | "seller" | "advertiser" | "admin";
  storeName?: string;
  businessType?: string;
  categories?: string;
  taxNumber?: string;
  address?: string;
  website?: string;
  logo?: string;
  uniqueId?: string;
  location?: string;
  profilePicture?: string;
  tagline?: string;
  storeDescription?: string;
  ownerMessage?: string;
  yearEstablished?: string;
  employeeCount?: string;
  annualTurnover?: string;
  paymentModes?: string;
  exportMarkets?: string;
  certifications?: string;
  whyUs?: string;
  createdAt?: string;
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  userId: number;
  createdAt: string;
  author?: string;
  storeName?: string;
  role?: string;
  profilePicture?: string;
  category?: string;
  tags?: string[];
  price?: number | null;
  unit?: string;
  minOrder?: number;
  stock?: number | null;
  imageUrl?: string;
  images?: string;
  verified?: number;
  views?: number;
  listingType?: string | null;
  reviewCount?: number;
  averageRating?: number;
}

export interface Store {
  id: number;
  name: string;
  email: string;
  storeName?: string;
  businessType?: string;
  categories?: string;
  address?: string;
  website?: string;
  logo?: string;
  createdAt: string;
  storeViews?: number;
  tagline?: string;
  storeDescription?: string;
}

export interface BannerAd {
  id: number;
  userId: number;
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl: string;
  status: string;
  createdAt?: string;
  expiresAt?: string | null;
  contactName?: string;
  contactNumber?: string;
  industry?: string;
  adAddress?: string;
  notes?: string;
  advertiserName?: string;
  advertiserCompany?: string;
}

export interface Conversation {
  id: number;
  buyerId: number;
  sellerId: number;
  listingId?: number;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPicture?: string;
  sellerName: string;
  sellerEmail: string;
  sellerPicture?: string;
  storeName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  message: string;
  content?: string;
  createdAt: string;
  senderName: string;
  senderEmail: string;
  senderPicture?: string;
}

export interface Review {
  id: number;
  adId: number;
  userId: number;
  rating: number;
  reviewText: string;
  createdAt: string;
  userName: string;
  profilePicture?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export interface WishlistItem extends Ad {
  wishlistId: number;
  addedAt: string;
}
