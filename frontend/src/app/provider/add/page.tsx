"use client";

import dynamic from "next/dynamic";
import { KeyboardEvent, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  MapPin,
  Mountain,
  Upload,
  X,
} from "lucide-react";

const LocationPickerMap = dynamic(
  () => import("@/components/provider/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-xl border border-gray-200 bg-gray-100 md:h-80" />
    ),
  }
);

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");
const KATHMANDU_COORDS: [number, number] = [27.7172, 85.324];

const EXPERIENCE_CATEGORIES = [
  { value: "HOMESTAY", label: "Homestay" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "GUIDE", label: "Guide" },
  { value: "HERITAGE_SITE", label: "Heritage Site" },
  { value: "FOOD_TOUR", label: "Food Tour" },
  { value: "TREKKING", label: "Trekking" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "WELLNESS", label: "Wellness" },
] as const;

const LANGUAGE_SUGGESTIONS = [
  "Nepali",
  "English",
  "Hindi",
  "Newari",
  "Tamang",
  "Gurung",
  "Sherpa",
];

const AMENITY_SUGGESTIONS = [
  "WiFi",
  "Local Meal",
  "Guide Included",
  "Transport Pickup",
  "Cultural Program",
  "First Aid",
  "Drinking Water",
];

type DistrictOption = {
  name: string;
  latitude: number;
  longitude: number;
};

type ProvinceOption = {
  name: string;
  districts: DistrictOption[];
};

const PROVINCES: ProvinceOption[] = [
  {
    name: "Bagmati",
    districts: [
      { name: "Kathmandu", latitude: 27.7172, longitude: 85.324 },
      { name: "Lalitpur", latitude: 27.6644, longitude: 85.3188 },
      { name: "Bhaktapur", latitude: 27.671, longitude: 85.4298 },
      { name: "Kavrepalanchok", latitude: 27.6298, longitude: 85.5422 },
      { name: "Rasuwa", latitude: 28.1167, longitude: 85.3833 },
      { name: "Nuwakot", latitude: 27.9167, longitude: 85.15 },
    ],
  },
  {
    name: "Koshi",
    districts: [
      { name: "Morang", latitude: 26.487, longitude: 87.2834 },
      { name: "Sunsari", latitude: 26.6217, longitude: 87.1478 },
      { name: "Solukhumbu", latitude: 27.7006, longitude: 86.7416 },
      { name: "Jhapa", latitude: 26.545, longitude: 87.895 },
    ],
  },
  {
    name: "Madhesh",
    districts: [
      { name: "Dhanusha", latitude: 26.7288, longitude: 85.9248 },
      { name: "Parsa", latitude: 27.0174, longitude: 84.8803 },
      { name: "Bara", latitude: 27.1342, longitude: 85.0607 },
      { name: "Saptari", latitude: 26.6542, longitude: 86.9156 },
    ],
  },
  {
    name: "Gandaki",
    districts: [
      { name: "Kaski", latitude: 28.2096, longitude: 83.9856 },
      { name: "Lamjung", latitude: 28.1667, longitude: 84.4167 },
      { name: "Gorkha", latitude: 28, longitude: 84.6333 },
      { name: "Syangja", latitude: 28.089, longitude: 83.8792 },
    ],
  },
  {
    name: "Lumbini",
    districts: [
      { name: "Rupandehi", latitude: 27.5333, longitude: 83.45 },
      { name: "Kapilvastu", latitude: 27.5333, longitude: 83.05 },
      { name: "Dang", latitude: 28, longitude: 82.5 },
      { name: "Banke", latitude: 28.05, longitude: 81.6167 },
    ],
  },
  {
    name: "Karnali",
    districts: [
      { name: "Surkhet", latitude: 28.6, longitude: 81.6333 },
      { name: "Jumla", latitude: 29.2742, longitude: 82.1838 },
      { name: "Dolpa", latitude: 29.1667, longitude: 83.0833 },
      { name: "Mugu", latitude: 29.5, longitude: 82.1 },
    ],
  },
  {
    name: "Sudurpashchim",
    districts: [
      { name: "Kailali", latitude: 28.7, longitude: 80.7667 },
      { name: "Kanchanpur", latitude: 28.8333, longitude: 80.3 },
      { name: "Doti", latitude: 29.2667, longitude: 80.9333 },
      { name: "Dadeldhura", latitude: 29.3, longitude: 80.5833 },
    ],
  },
];

type FormState = {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  pricePerPerson: string;
  currency: string;
  durationHours: string;
  maxGuests: string;
  locationName: string;
  latitude: string;
  longitude: string;
  district: string;
  province: string;
  thumbnailUrl: string;
  images: string[];
  panoramaImages: string[];
  streetViewUrl: string;
  amenities: string[];
  languages: string[];
};

const initialForm: FormState = {
  title: "",
  description: "",
  shortDescription: "",
  category: "HERITAGE_SITE",
  pricePerPerson: "2500",
  currency: "NPR",
  durationHours: "6",
  maxGuests: "8",
  locationName: "",
  latitude: KATHMANDU_COORDS[0].toString(),
  longitude: KATHMANDU_COORDS[1].toString(),
  district: "Kathmandu",
  province: "Bagmati",
  thumbnailUrl: "",
  images: [],
  panoramaImages: [],
  streetViewUrl: "",
  amenities: [],
  languages: [],
};

const steps = ["Details", "Location", "Media", "Review"];
const inputClass =
  "w-full border border-outline-variant bg-white px-3 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-fixed";
const labelClass = "font-label-sm text-label-sm uppercase text-on-surface-variant";
const sectionTitleClass = "font-h3 text-2xl text-on-surface";

type TagInputProps = {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  hint?: string;
};

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function TagInput({
  label,
  placeholder,
  values,
  onChange,
  suggestions = [],
  hint,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const next = normalizeTag(raw);
    if (!next) return;

    const exists = values.some((item) => item.toLowerCase() === next.toLowerCase());
    if (exists) return;

    onChange([...values, next]);
    setDraft("");
  };

  const removeTag = (target: string) => {
    onChange(values.filter((item) => item !== target));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    addTag(draft);
  };

  const availableSuggestions = suggestions.filter(
    (suggestion) =>
      !values.some((item) => item.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <div className="border border-outline-variant bg-white p-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={`${label}-${value}`}
              className="inline-flex items-center gap-1 border border-secondary/20 bg-secondary-fixed px-2.5 py-1 text-xs font-medium text-on-secondary-fixed"
            >
              <Check size={12} />
              {value}
              <button
                type="button"
                onClick={() => removeTag(value)}
                className="p-0.5 text-on-secondary-fixed transition hover:bg-white/60"
                aria-label={`Remove ${value}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={placeholder}
          className="w-full border-0 px-1 py-1.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
      </div>

      {!!availableSuggestions.length && (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.map((suggestion) => (
            <button
              key={`${label}-suggest-${suggestion}`}
              type="button"
              onClick={() => addTag(suggestion)}
              className="border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-xs text-on-surface-variant transition hover:border-primary hover:text-primary"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

export default function CreateExperiencePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailMode, setThumbnailMode] = useState<"upload" | "url">("upload");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const selectedProvince = useMemo(
    () => PROVINCES.find((province) => province.name === form.province) ?? PROVINCES[0],
    [form.province]
  );

  const selectedDistrict = useMemo(
    () =>
      selectedProvince.districts.find((district) => district.name === form.district) ??
      selectedProvince.districts[0],
    [selectedProvince, form.district]
  );

  const latitude = Number(form.latitude) || KATHMANDU_COORDS[0];
  const longitude = Number(form.longitude) || KATHMANDU_COORDS[1];

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProvinceChange = (provinceName: string) => {
    const province = PROVINCES.find((item) => item.name === provinceName) ?? PROVINCES[0];
    const defaultDistrict = province.districts[0];

    setForm((prev) => ({
      ...prev,
      province: province.name,
      district: defaultDistrict.name,
      latitude: defaultDistrict.latitude.toString(),
      longitude: defaultDistrict.longitude.toString(),
    }));
  };

  const handleDistrictChange = (districtName: string) => {
    const district = selectedProvince.districts.find((item) => item.name === districtName);
    setForm((prev) => ({
      ...prev,
      district: districtName,
      latitude: district ? district.latitude.toString() : prev.latitude,
      longitude: district ? district.longitude.toString() : prev.longitude,
    }));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!form.title.trim()) return "Title is required.";
      if (!form.description.trim()) return "Description is required.";
      if (!form.shortDescription.trim()) return "Short description is required.";
      if (!form.category) return "Category is required.";
      if (!form.pricePerPerson || Number(form.pricePerPerson) <= 0) {
        return "Price must be greater than 0.";
      }
      if (!form.durationHours || Number(form.durationHours) <= 0) {
        return "Duration in hours must be greater than 0.";
      }
      if (!form.maxGuests || Number(form.maxGuests) <= 0) {
        return "Max guests must be greater than 0.";
      }
    }

    if (currentStep === 2) {
      if (!form.locationName.trim()) return "Location name is required.";
      if (!form.province) return "Province is required.";
      if (!form.district) return "District is required.";
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return "Latitude and longitude are required.";
      }
    }

    if (currentStep === 3) {
      if (thumbnailMode === "upload" && !thumbnail) {
        return "Please upload a thumbnail image.";
      }
      if (thumbnailMode === "url" && !form.thumbnailUrl.trim()) {
        return "Please enter a thumbnail URL.";
      }
      if (!form.panoramaImages.length) {
        return "Add at least one panorama URL.";
      }
    }

    return null;
  };

  const moveStep = (direction: "next" | "prev") => {
    if (direction === "next") {
      const error = validateStep(step);
      if (error) {
        toast.error(error);
        return;
      }
      setStep((prev) => Math.min(prev + 1, steps.length));
      return;
    }

    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const detailsError = validateStep(1);
    if (detailsError) {
      toast.error(detailsError);
      setStep(1);
      return;
    }

    const locationError = validateStep(2);
    if (locationError) {
      toast.error(locationError);
      setStep(2);
      return;
    }

    const mediaError = validateStep(3);
    if (mediaError) {
      toast.error(mediaError);
      setStep(3);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in as a provider first.");
      return;
    }

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("description", form.description.trim());
    payload.append("shortDescription", form.shortDescription.trim());
    payload.append("category", form.category);
    payload.append("pricePerPerson", String(Math.round(Number(form.pricePerPerson))));
    payload.append("currency", form.currency.trim() || "NPR");
    payload.append("durationHours", String(Math.round(Number(form.durationHours))));
    payload.append("maxGuests", String(Math.round(Number(form.maxGuests))));
    payload.append("locationName", form.locationName.trim());
    payload.append("latitude", form.latitude.trim());
    payload.append("longitude", form.longitude.trim());
    payload.append("district", form.district);
    payload.append("province", form.province);
    payload.append("thumbnailUrl", thumbnailMode === "url" ? form.thumbnailUrl.trim() : "");

    payload.append("panoramaImages", JSON.stringify(form.panoramaImages));
    payload.append("amenities", JSON.stringify(form.amenities));
    payload.append("languages", JSON.stringify(form.languages));

    if (thumbnailMode === "upload" && thumbnail) {
      payload.append("thumbnail", thumbnail);
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/experiences/provider`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(response.data?.message || "Experience submitted successfully.");
      setForm(initialForm);
      setThumbnail(null);
      setThumbnailMode("upload");
      setStep(1);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Could not submit experience."
        : "Could not submit experience.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mandala-pattern min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(192,86,33,0.14),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(55,104,80,0.13),transparent_30%),linear-gradient(180deg,#f9f9ff_0%,#f0f3ff_52%,#ffffff_100%)] px-4 py-8 md:py-12">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: "2px", border: "1px solid #dec0b5" },
        }}
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 grid gap-6 border-l-4 border-primary-container bg-white/75 p-5 shadow-[0_18px_60px_rgba(18,28,44,0.08)] backdrop-blur md:grid-cols-[1.4fr_0.8fr] md:p-7">
          <div className="animate-fade-in-up">
            <p className="font-label-sm text-label-sm uppercase text-primary">Nepal Uncharted</p>
            <h1 className="mt-3 max-w-2xl font-h1 text-4xl text-on-surface md:text-h1">
              Create a heritage experience
            </h1>
            <p className="mt-3 max-w-2xl text-body-md text-on-surface-variant">
              Shape a listing with clean details, precise location, and immersive media for traveler review.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 self-end md:grid-cols-1">
            <div className="border border-outline-variant bg-surface-container-lowest p-3 transition hover:-translate-y-0.5 hover:border-primary">
              <Mountain className="mb-3 text-secondary" size={20} strokeWidth={1.8} />
              <p className="font-serif text-sm text-on-surface">Community-led travel</p>
              <p className="mt-1 text-xs text-on-surface-variant">Keep culture, hosts, and place visible.</p>
            </div>
            <div className="border border-outline-variant bg-inverse-surface p-3 text-inverse-on-surface transition hover:-translate-y-0.5">
              <Camera className="mb-3 text-inverse-primary" size={20} strokeWidth={1.8} />
              <p className="font-serif text-sm">Immersive media ready</p>
              <p className="mt-1 text-xs text-inverse-on-surface/75">Panorama URLs are required for publishing.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit border border-outline-variant bg-white/85 p-4 shadow-[0_14px_40px_rgba(18,28,44,0.06)] backdrop-blur">
            <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Submission flow</p>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {steps.map((label, index) => {
                const stepNumber = index + 1;
                const active = stepNumber === step;
                const done = stepNumber < step;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 border p-3 text-sm transition ${active
                      ? "border-primary bg-primary-container text-on-primary-container shadow-[0_10px_30px_rgba(192,86,33,0.24)]"
                      : done
                        ? "border-secondary/30 bg-secondary-fixed text-on-secondary-fixed"
                        : "border-outline-variant bg-white text-on-surface-variant"
                      }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center border border-current font-serif text-sm">
                      {done ? <Check size={15} /> : stepNumber}
                    </span>
                    <span className="font-serif">{label}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="border border-outline-variant bg-white p-4 shadow-[0_18px_60px_rgba(18,28,44,0.08)] md:p-7">
            <div className="space-y-6">
              {step === 1 && (
                <section className="grid animate-fade-in-up grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <h2 className={sectionTitleClass}>Experience Details</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      The essentials travelers and reviewers see first.
                    </p>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <label className={labelClass}>Title</label>
                    <input
                      value={form.title}
                      onChange={(event) => setField("title", event.target.value)}
                      placeholder="Traditional Newari Food Walk"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => setField("description", event.target.value)}
                      rows={5}
                      placeholder="Write the full experience details..."
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className={labelClass}>Short Description</label>
                    <textarea
                      value={form.shortDescription}
                      onChange={(event) => setField("shortDescription", event.target.value)}
                      rows={2}
                      placeholder="One short summary for cards/listing."
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Category</label>
                    <select
                      value={form.category}
                      onChange={(event) => setField("category", event.target.value)}
                      className={inputClass}
                    >
                      {EXPERIENCE_CATEGORIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Currency</label>
                    <input
                      value={form.currency}
                      onChange={(event) => setField("currency", event.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="border border-outline-variant bg-surface-container-lowest p-4 md:col-span-2">
                    <div className="flex items-center justify-between text-sm">
                      <label className={labelClass}>Price per person</label>
                      <span className="font-serif text-lg text-primary">
                        NPR {Number(form.pricePerPerson).toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={50000}
                      step={500}
                      value={form.pricePerPerson}
                      onChange={(event) => setField("pricePerPerson", event.target.value)}
                      className="mt-3 w-full accent-primary"
                    />
                  </div>

                  <div className="border border-outline-variant bg-surface-container-lowest p-4">
                    <div className="flex items-center justify-between text-sm">
                      <label className={labelClass}>Duration</label>
                      <span className="font-serif text-lg text-primary">{form.durationHours} hrs</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={72}
                      step={1}
                      value={form.durationHours}
                      onChange={(event) => setField("durationHours", event.target.value)}
                      className="mt-3 w-full accent-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Max Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.maxGuests}
                      onChange={(event) => setField("maxGuests", event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="animate-fade-in-up space-y-5">
                  <div>
                    <h2 className={sectionTitleClass}>Location</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Pick the administrative area, then place the exact marker.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className={labelClass}>Location Name</label>
                      <input
                        value={form.locationName}
                        onChange={(event) => setField("locationName", event.target.value)}
                        placeholder="Kathmandu Durbar Square"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Province</label>
                      <select
                        value={form.province}
                        onChange={(event) => handleProvinceChange(event.target.value)}
                        className={inputClass}
                      >
                        {PROVINCES.map((province) => (
                          <option key={province.name} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>District</label>
                      <select
                        value={form.district}
                        onChange={(event) => handleDistrictChange(event.target.value)}
                        className={inputClass}
                      >
                        {selectedProvince.districts.map((district) => (
                          <option key={district.name} value={district.name}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(event) => setField("latitude", event.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(event) => setField("longitude", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 border border-tertiary-fixed-dim bg-tertiary-fixed px-3 py-2 text-xs text-on-tertiary-fixed">
                    <MapPin size={14} />
                    Click map to place exact marker. Default focus: {selectedDistrict.name}
                  </div>

                  <LocationPickerMap
                    latitude={latitude}
                    longitude={longitude}
                    onPick={(pickedLat, pickedLng) => {
                      setField("latitude", String(pickedLat));
                      setField("longitude", String(pickedLng));
                    }}
                  />
                </section>
              )}

              {step === 3 && (
                <section className="animate-fade-in-up space-y-5">
                  <div>
                    <h2 className={sectionTitleClass}>Media</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Add the image and panorama material that make the experience inspectable.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label className={labelClass}>Thumbnail Source</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailMode("upload");
                          setField("thumbnailUrl", "");
                        }}
                        className={`flex items-center justify-center gap-2 border px-3 py-3 text-sm transition ${thumbnailMode === "upload"
                          ? "border-primary bg-primary-container text-on-primary-container"
                          : "border-outline-variant bg-white text-on-surface-variant hover:border-primary hover:text-primary"
                          }`}
                      >
                        <Upload size={16} />
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailMode("url");
                          setThumbnail(null);
                        }}
                        className={`flex items-center justify-center gap-2 border px-3 py-3 text-sm transition ${thumbnailMode === "url"
                          ? "border-primary bg-primary-container text-on-primary-container"
                          : "border-outline-variant bg-white text-on-surface-variant hover:border-primary hover:text-primary"
                          }`}
                      >
                        <Link2 size={16} />
                        Thumbnail URL
                      </button>
                    </div>
                  </div>

                  {thumbnailMode === "upload" ? (
                    <div className="space-y-2">
                      <label className={labelClass}>Upload Thumbnail</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setThumbnail(event.target.files?.[0] ?? null)}
                        className="w-full border border-outline-variant bg-white px-3 py-3 text-sm text-on-surface file:mr-4 file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:text-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className={labelClass}>Thumbnail URL</label>
                      <input
                        value={form.thumbnailUrl}
                        onChange={(event) => setField("thumbnailUrl", event.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </div>
                  )}

                  <TagInput
                    label="Panorama URLs"
                    values={form.panoramaImages}
                    onChange={(next) => setField("panoramaImages", next)}
                    placeholder="Paste URL and press Enter"
                    hint="At least one panorama URL is required."
                  />


                  <TagInput
                    label="Amenities"
                    values={form.amenities}
                    onChange={(next) => setField("amenities", next)}
                    placeholder="Type amenity and press Enter"
                    suggestions={AMENITY_SUGGESTIONS}
                    hint="Recommended options are clickable. You can add custom ones."
                  />

                  <TagInput
                    label="Languages"
                    values={form.languages}
                    onChange={(next) => setField("languages", next)}
                    placeholder="Type language and press Enter"
                    suggestions={LANGUAGE_SUGGESTIONS}
                    hint="Recommended languages shown below."
                  />
                </section>
              )}

              {step === 4 && (
                <section className="animate-fade-in-up space-y-5 border border-outline-variant bg-surface-container-lowest p-4">
                  <div>
                    <h2 className={sectionTitleClass}>Review</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Confirm the listing summary before it goes to the provider endpoint.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-on-surface-variant md:grid-cols-2">
                    <div className="border border-outline-variant bg-white p-3">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Title</span>
                      <span className="mt-1 block font-serif text-base text-on-surface">{form.title || "-"}</span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Category</span>
                      <span className="mt-1 block font-serif text-base text-on-surface">{form.category}</span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Price</span>
                      <span className="mt-1 block font-serif text-base text-on-surface">
                        NPR {Number(form.pricePerPerson).toLocaleString()}
                      </span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Duration</span>
                      <span className="mt-1 block font-serif text-base text-on-surface">
                        {form.durationHours} hrs
                      </span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Guests</span>
                      <span className="mt-1 block font-serif text-base text-on-surface">{form.maxGuests}</span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">District</span>
                      <span className="mt-1 block font-serif text-base text-on-surface">{form.district}</span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3 md:col-span-2">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Coordinates</span>
                      <span className="mt-1 block text-on-surface">
                        {form.latitude}, {form.longitude}
                      </span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3 md:col-span-2">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Panorama URLs</span>
                      <span className="mt-1 block text-on-surface">{form.panoramaImages.length}</span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3 md:col-span-2">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Amenities</span>
                      <span className="mt-1 block text-on-surface">
                        {form.amenities.length ? form.amenities.join(", ") : "-"}
                      </span>
                    </div>
                    <div className="border border-outline-variant bg-white p-3 md:col-span-2">
                      <span className="block font-label-sm text-label-sm uppercase text-primary">Languages</span>
                      <span className="mt-1 block text-on-surface">
                        {form.languages.length ? form.languages.join(", ") : "-"}
                      </span>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-outline-variant pt-5">
              <button
                type="button"
                onClick={() => moveStep("prev")}
                disabled={step === 1 || loading}
                className="inline-flex items-center gap-2 border border-outline-variant bg-white px-4 py-2.5 font-serif text-sm text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {step < steps.length ? (
                <button
                  type="button"
                  onClick={() => moveStep("next")}
                  className="inline-flex items-center gap-2 bg-primary-container px-5 py-2.5 font-serif text-sm text-on-primary-container transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-primary-container px-5 py-2.5 font-serif text-sm text-on-primary-container transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Submitting..." : "Submit Experience"}
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
