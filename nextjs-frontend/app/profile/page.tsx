"use client";
import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser, setUser } from "@/lib/auth";
import type { User } from "@/types";

// India states + cities for location picker
const INDIA_LOCATIONS: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Kakinada",
    "Tirupati",
    "Anantapur",
    "Rajahmundry",
    "Eluru",
  ],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tezpur"],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Tezpur",
    "Bongaigaon",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
    "Purnia",
    "Arrah",
    "Bihar Sharif",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Korba",
    "Bilaspur",
    "Durg",
    "Rajnandgaon",
    "Raigarh",
  ],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Junagadh",
    "Anand",
    "Navsari",
  ],
  Haryana: [
    "Faridabad",
    "Gurgaon",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
    "Sonipat",
    "Panchkula",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Solan",
    "Dharamsala",
    "Mandi",
    "Kullu",
    "Baddi",
    "Nahan",
    "Palampur",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Phusro",
    "Hazaribagh",
    "Giridih",
  ],
  Karnataka: [
    "Bengaluru",
    "Mysuru",
    "Hubballi",
    "Mangaluru",
    "Belagavi",
    "Kalaburagi",
    "Davanagere",
    "Ballari",
    "Vijayapura",
    "Shivamogga",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Malappuram",
    "Kannur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
    "Kottayam",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Ratlam",
    "Satna",
    "Murwara",
    "Dewas",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Amravati",
    "Kolhapur",
    "Thane",
    "Sangli",
  ],
  Manipur: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
  Meghalaya: ["Shillong", "Tura", "Jowai"],
  Mizoram: ["Aizawl", "Lunglei", "Champhai"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Brahmapur",
    "Sambalpur",
    "Puri",
    "Balasore",
    "Baripada",
  ],
  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Firozpur",
    "Hoshiarpur",
    "Batala",
    "Pathankot",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhilwara",
    "Alwar",
    "Bharatpur",
    "Sikar",
  ],
  Sikkim: ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Ranipet",
    "Vellore",
    "Erode",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
    "Ramagundam",
    "Mahbubnagar",
    "Nalgonda",
  ],
  Tripura: ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Meerut",
    "Prayagraj",
    "Bareilly",
    "Aligarh",
    "Moradabad",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
  ],
  "West Bengal": [
    "Kolkata",
    "Siliguri",
    "Durgapur",
    "Asansol",
    "Bardhaman",
    "Malda",
    "Baharampur",
    "Habra",
  ],
  Delhi: [
    "New Delhi",
    "Dwarka",
    "Rohini",
    "Janakpuri",
    "Saket",
    "Lajpat Nagar",
    "Karol Bagh",
    "Connaught Place",
  ],
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStoreName, setEditStoreName] = useState("");
  const [editBusinessType, setEditBusinessType] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editStoreDescription, setEditStoreDescription] = useState("");
  const [editOwnerMessage, setEditOwnerMessage] = useState("");
  const [editYearEstablished, setEditYearEstablished] = useState("");
  const [editEmployeeCount, setEditEmployeeCount] = useState("");
  const [editAnnualTurnover, setEditAnnualTurnover] = useState("");
  const [editCertifications, setEditCertifications] = useState("");
  const [editPaymentModes, setEditPaymentModes] = useState("");
  const [editExportMarkets, setEditExportMarkets] = useState("");
  const [editWhyUs, setEditWhyUs] = useState("");
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState("");
  const picRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUserState(u);
  }, [router]);

  function openEdit() {
    if (!user) return;
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    // parse location e.g. "City, State, India"
    const parts = (user.location || "").split(",").map((s: string) => s.trim());
    const storedState = parts.length >= 2 ? parts[parts.length - 2] : "";
    const storedCity = parts.length >= 1 ? parts[0] : "";
    setEditState(storedState);
    setEditCity(storedCity);
    setEditStoreName(user.storeName || "");
    setEditBusinessType(user.businessType || "");
    setEditAddress(user.address || "");
    setEditTagline((user as any).tagline || "");
    setEditStoreDescription((user as any).storeDescription || "");
    setEditOwnerMessage((user as any).ownerMessage || "");
    setEditYearEstablished((user as any).yearEstablished || "");
    setEditEmployeeCount((user as any).employeeCount || "");
    setEditAnnualTurnover((user as any).annualTurnover || "");
    setEditCertifications((user as any).certifications || "");
    setEditPaymentModes((user as any).paymentModes || "");
    setEditExportMarkets((user as any).exportMarkets || "");
    setEditWhyUs((user as any).whyUs || "");
    setPicPreview(user.profilePicture || user.storeLogo || "");
    setPicFile(null);
    setMsg("");
    setIsEditing(true);
    window.scrollTo(0, 0);
  }

  function cancelEdit() {
    setIsEditing(false);
    window.scrollTo(0, 0);
  }

  function handlePicChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPicFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPicPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg("");

    const fd = new FormData();
    fd.append("userId", String(user.id));
    fd.append("name", editName);
    fd.append("phone", editPhone);

    const locParts = [editCity, editState, "India"].filter(
      (v) => v && v !== "— Select State —" && v !== "— Select City —",
    );
    fd.append("location", locParts.join(", "));

    if (user.role === "seller") {
      fd.append("storeName", editStoreName);
      fd.append("businessType", editBusinessType);
      fd.append("address", editAddress);
      fd.append("tagline", editTagline);
      fd.append("storeDescription", editStoreDescription);
      fd.append("ownerMessage", editOwnerMessage);
      fd.append("yearEstablished", editYearEstablished);
      fd.append("employeeCount", editEmployeeCount);
      fd.append("annualTurnover", editAnnualTurnover);
      fd.append("certifications", editCertifications);
      fd.append("paymentModes", editPaymentModes);
      fd.append("exportMarkets", editExportMarkets);
      fd.append("whyUs", editWhyUs);
    }

    if (picFile) fd.append("profilePicture", picFile);

    try {
      const res = await fetch("/api/user/profile", { method: "PUT", body: fd });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        setUserState(updatedUser);
        setMsg("Profile updated successfully!");
        setIsEditing(false);
        window.scrollTo(0, 0);
      } else {
        setMsg(data.error || "Failed to update profile");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  function changePassword() {
    alert("Change password feature coming soon!");
  }

  function deleteAccount() {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      localStorage.removeItem("bigspice_user");
      alert("Account deleted.");
      router.replace("/");
    }
  }

  if (!user) return null;

  const avatarInitial = (user.name || user.email || "U")
    .charAt(0)
    .toUpperCase();
  const avatarSrc = user.profilePicture || user.storeLogo || "";
  const roleLabel =
    user.role === "seller"
      ? "Seller"
      : user.role === "advertiser"
        ? "Advertiser"
        : "Buyer";

  const cities =
    editState && INDIA_LOCATIONS[editState] ? INDIA_LOCATIONS[editState] : [];

  // ── View mode ─────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
          {msg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {msg}
            </div>
          )}

          {/* Header card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 mb-6 flex-wrap">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#d35400] to-yellow-500 flex items-center justify-center text-4xl font-bold text-white flex-shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.name || "User"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-[#d35400] text-white text-xs font-semibold rounded-full">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Account info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 border-b-2 border-[#d35400] inline-block pb-2 mb-5">
              Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoItem
                label="Unique ID"
                value={
                  <span className="font-semibold text-[#d35400]">
                    {(user as any).uniqueId || "—"}
                  </span>
                }
              />
              <InfoItem label="Full Name" value={user.name || "—"} />
              <InfoItem label="Email" value={user.email || "—"} />
              <InfoItem label="Phone" value={user.phone || "—"} />
              <InfoItem label="Location" value={user.location || "—"} />
              <InfoItem label="Role" value={roleLabel} />
            </div>
          </div>

          {/* Seller store section */}
          {user.role === "seller" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 border-b-2 border-[#d35400] inline-block pb-2 mb-5">
                Store Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem label="Store Name" value={user.storeName || "—"} />
                <InfoItem
                  label="Business Type"
                  value={user.businessType || "—"}
                />
                <InfoItem
                  label="Category"
                  value={(user as any).categories || "—"}
                />
                <InfoItem label="Address" value={user.address || "—"} />
              </div>
            </div>
          )}

          {/* Advertiser section */}
          {user.role === "advertiser" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 border-b-2 border-[#d35400] inline-block pb-2 mb-5">
                Advertiser Account
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem
                  label="Company / Brand Name"
                  value={user.storeName || "—"}
                />
                <InfoItem
                  label="Website"
                  value={(user as any).website || "—"}
                />
                <InfoItem label="Contact Number" value={user.phone || "—"} />
                <InfoItem label="Industry" value={user.businessType || "—"} />
                <div className="sm:col-span-2">
                  <InfoItem label="Address" value={user.address || "—"} />
                </div>
              </div>
              <div className="mt-5">
                <a
                  href="/advertiser-dashboard"
                  className="inline-block px-4 py-2 bg-[#d35400] text-white rounded-lg text-sm font-semibold hover:bg-[#b84800] transition-colors"
                >
                  Manage My Banner Ads →
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 border-b-2 border-[#d35400] inline-block pb-2 mb-5">
              Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openEdit}
                className="px-5 py-2.5 bg-[#d35400] text-white rounded-lg font-semibold hover:bg-[#b84800] transition-colors text-sm"
              >
                Edit Profile
              </button>
              <button
                onClick={changePassword}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Change Password
              </button>
              <button
                onClick={deleteAccount}
                className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {msg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {msg}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-7 pb-5 border-b-2 border-[#d35400]">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Personal Information */}
            <SectionTitle>Personal Information</SectionTitle>

            {/* Profile picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                ref={picRef}
                accept="image/*"
                onChange={handlePicChange}
                className="block w-full text-sm"
              />
              {picPreview && (
                <img
                  src={picPreview}
                  alt="preview"
                  className="mt-2 w-20 h-20 rounded-full object-cover border"
                />
              )}
            </div>

            <FormField label="Full Name">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
              />
            </FormField>

            <FormField label="Phone">
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
              />
            </FormField>

            <FormField label="Location">
              <div className="flex gap-2 flex-wrap">
                <select
                  value={editState}
                  onChange={(e) => {
                    setEditState(e.target.value);
                    setEditCity("");
                  }}
                  className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                >
                  <option value="">All States</option>
                  {Object.keys(INDIA_LOCATIONS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* Seller-specific fields */}
            {user.role === "seller" && (
              <>
                <SectionTitle>Store Information</SectionTitle>

                <FormField label="Store Name">
                  <input
                    type="text"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Business Type">
                  <input
                    type="text"
                    value={editBusinessType}
                    onChange={(e) => setEditBusinessType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Address">
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <SectionTitle>Store Profile Page</SectionTitle>

                <FormField
                  label={
                    <>
                      Tagline{" "}
                      <span className="text-gray-400 font-normal">
                        (short slogan)
                      </span>
                    </>
                  }
                >
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    placeholder={`e.g. "India's Finest Spice Exporter"`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField
                  label={
                    <>
                      About the Store{" "}
                      <span className="text-gray-400 font-normal">
                        (shown on Store Profile page)
                      </span>
                    </>
                  }
                >
                  <textarea
                    rows={4}
                    value={editStoreDescription}
                    onChange={(e) => setEditStoreDescription(e.target.value)}
                    placeholder="Describe your business, what you offer, your strengths…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Owner / CEO Message">
                  <textarea
                    rows={4}
                    value={editOwnerMessage}
                    onChange={(e) => setEditOwnerMessage(e.target.value)}
                    placeholder="A personal message from the owner to buyers…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Year Established">
                  <input
                    type="text"
                    value={editYearEstablished}
                    onChange={(e) => setEditYearEstablished(e.target.value)}
                    placeholder="e.g. 2010"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Number of Employees">
                  <input
                    type="text"
                    value={editEmployeeCount}
                    onChange={(e) => setEditEmployeeCount(e.target.value)}
                    placeholder="e.g. 50–100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Annual Turnover (approx.)">
                  <input
                    type="text"
                    value={editAnnualTurnover}
                    onChange={(e) => setEditAnnualTurnover(e.target.value)}
                    placeholder="e.g. ₹1 Cr – ₹5 Cr"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField
                  label={
                    <>
                      Certifications{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated)
                      </span>
                    </>
                  }
                >
                  <input
                    type="text"
                    value={editCertifications}
                    onChange={(e) => setEditCertifications(e.target.value)}
                    placeholder="e.g. FSSAI, ISO 22000, Organic India"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField
                  label={
                    <>
                      Payment Modes{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated)
                      </span>
                    </>
                  }
                >
                  <input
                    type="text"
                    value={editPaymentModes}
                    onChange={(e) => setEditPaymentModes(e.target.value)}
                    placeholder="e.g. Bank Transfer, LC, PayPal"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField
                  label={
                    <>
                      Export Markets{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated)
                      </span>
                    </>
                  }
                >
                  <input
                    type="text"
                    value={editExportMarkets}
                    onChange={(e) => setEditExportMarkets(e.target.value)}
                    placeholder="e.g. USA, UAE, Germany"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>

                <FormField label="Why Choose Us">
                  <textarea
                    rows={3}
                    value={editWhyUs}
                    onChange={(e) => setEditWhyUs(e.target.value)}
                    placeholder="Key USPs that differentiate you from competitors…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </FormField>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#d35400] text-white rounded-lg font-semibold hover:bg-[#b84800] transition-colors text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-[#d35400] uppercase tracking-widest mt-5 mb-1 pb-2 border-b border-gray-200">
      {children}
    </p>
  );
}

function FormField({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
