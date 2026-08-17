import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Minus, CarFront } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";
import TravelHeader from "./header";
import Footer from "./Footer";
import config from "../../../config/config";

interface Vehicle {
  vehicleId: number;
  vehicleName: string;
  vehicleImg: string | string[];
  localPerHour: number | null;
  localPerKm: number | null;
  OutstationPerKm: number | null;
  OSDriverBata: number | null;
  availableStatus: boolean;
}

interface VehicleType {
  vehicleTypeId: number;
  vehicleType: string;
  priorMinutes: number;
  seatCapacity: number;
  vehicles: Vehicle[];
}

interface PackageItem {
  packageType: string;
  packages: any;
  isDeleted?: boolean;
}

const VehicleDetails: React.FC = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [packageLoading, setPackageLoading] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<"vehicle" | "package">("package");

  // ✅ default ah Local City Use select aagirukum
  const [selectedType, setSelectedType] = useState<string>("Local City Use");

  const companyId = localStorage.getItem("companyId") || "";

  const formatTerm = (term: string) => {
    return term
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatValue = (term: string, value: any) => {
    if (value === undefined || value === null || value === "") return "-";

    if (term.toLowerCase().includes("minimum")) {
      return value;
    }

    return `₹ ${value}`;
  };

  const mapUiTypeToApiType = (type: string) => {
    const normalized = type.toLowerCase().trim();

    if (normalized === "local city use") return "Local City Use";
    if (normalized === "out station") return "Out Station";

    return type;
  };

  const fetchPackages = async (packageType: string) => {
    try {
      if (!companyId || !packageType) {
        setPackages([]);
        return;
      }

      setPackageLoading(true);

      const apiPackageType = mapUiTypeToApiType(packageType);

      const res = await axiosInstance.get("/packageData/getAllPackageData", {
        params: {
          companyId,
          packageType: apiPackageType,
        },
      });

      if (res.data?.success && Array.isArray(res.data?.data)) {
        const filtered = res.data.data.filter((p: any) => !p.isDeleted);

        const parsedPackages = filtered.map((p: any) => ({
          ...p,
          packageType: p.packageType,
          packages:
            typeof p.packages === "string" ? JSON.parse(p.packages) : p.packages,
        }));

        setPackages(parsedPackages);
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
      setPackages([]);
    } finally {
      setPackageLoading(false);
    }
  };

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/vehicleType/vehicleTypeWithVehicles");

      if (response.data.success) {
        const formattedData = response.data.data.map((item: any) => ({
          ...item,
          vehicles: item.vehicle || [],
        }));
        setVehicleTypes(formattedData);
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, []);

  useEffect(() => {
    fetchPackages(selectedType);
  }, [selectedType]);

  const buildImageUrl = (filenameOrUrl: string) => {
    if (!filenameOrUrl) return "";
    if (/^https?:\/\//i.test(filenameOrUrl)) return filenameOrUrl;

    const BASE_URL = config.baseurl.apibaseurl;
    const baseUrl = axiosInstance.defaults.baseURL
      ? axiosInstance.defaults.baseURL.replace(/\/api\/?$/, "")
      : BASE_URL;

    return `${baseUrl}/uploads/vehicleImg/${filenameOrUrl}`;
  };

  const getVehicleImage = (vehicleImg: string | string[]) => {
    if (!vehicleImg) return "";

    if (Array.isArray(vehicleImg)) {
      return vehicleImg.length > 0 ? buildImageUrl(vehicleImg[0]) : "";
    }

    return buildImageUrl(vehicleImg);
  };

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
    setShowDetails(null);
  };

  const toggleTable = (id: number) => {
    setShowDetails(showDetails === id ? null : id);
  };

  const packageTypeOptions = ["Local City Use", "Out Station"];

  return (
    <>
      <TravelHeader />

      <div className="max-w-6xl mx-auto mt-10 px-4">
        {/* Top Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setViewMode("vehicle")}
            className={`px-4 py-2 rounded ${
              viewMode === "vehicle"
                ? "bg-[#275981] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Vehicle Details
          </button>

          <button
            onClick={() => setViewMode("package")}
            className={`px-4 py-2 rounded ${
              viewMode === "package"
                ? "bg-[#275981] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Package Details
          </button>
        </div>

        {/* ---------------- VEHICLE VIEW ---------------- */}
        {viewMode === "vehicle" && (
          <>
            {loading ? (
              <p className="text-center text-gray-500">Loading vehicle data...</p>
            ) : vehicleTypes.length === 0 ? (
              <p className="text-center text-gray-500">No vehicle types found.</p>
            ) : (
              vehicleTypes.map((v) => (
                <div
                  key={v.vehicleTypeId}
                  className="mb-4 border border-gray-300 rounded-md shadow-sm"
                >
                  <button
                    onClick={() => toggleAccordion(v.vehicleTypeId)}
                    className="flex justify-between items-center w-full bg-[#275981] text-white px-4 py-3 rounded-t-md focus:outline-none"
                  >
                    <div className="flex items-center space-x-2">
                      <CarFront className="w-5 h-5" />
                      <span className="font-medium">{v.vehicleType}</span>
                      <span className="text-sm font-light">
                        - Advance Booking Hours : {v.priorMinutes}
                      </span>
                    </div>
                    {openId === v.vehicleTypeId ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  {openId === v.vehicleTypeId && (
                    <div className="border-t border-gray-300 bg-gray-50 p-4">
                      <div
                        className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded-md cursor-pointer"
                        onClick={() => toggleTable(v.vehicleTypeId)}
                      >
                        <span className="text-gray-700 font-medium">
                          Vehicle Details
                        </span>
                        {showDetails === v.vehicleTypeId ? (
                          <Minus className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Plus className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      {showDetails === v.vehicleTypeId &&
                        v.vehicles &&
                        v.vehicles.length > 0 && (
                          <div className="overflow-x-auto mt-4">
                            <table className="min-w-full border border-gray-300 bg-white">
                              <tbody>
                                {v.vehicles.map((r: any) => (
                                  <tr key={r.vehicleId} className="border-t">
                                    <td className="border px-4 py-3">
                                      <div>
                                        <p className="text-blue-600 font-medium mb-2">
                                          {r.vehicleName}
                                        </p>

                                        {r.vehicleImg && (
                                          <img
                                            src={getVehicleImage(r.vehicleImg)}
                                            alt={r.vehicleName}
                                            className="w-40 h-28 object-cover border rounded"
                                          />
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      {showDetails === v.vehicleTypeId &&
                        (!v.vehicles || v.vehicles.length === 0) && (
                          <p className="mt-4 text-center text-gray-500">
                            No vehicles found for this type.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ---------------- PACKAGE VIEW ---------------- */}
        {viewMode === "package" && (
          <>
            {/* default Local City Use selected */}
            <div className="mt-6 flex gap-6">
              {packageTypeOptions.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer text-lg"
                >
                  <input
                    type="radio"
                    name="packageType"
                    value={type}
                    checked={selectedType === type}
                    onChange={() => setSelectedType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            {packageLoading ? (
              <p className="text-center text-gray-500 mt-8">
                Loading package data...
              </p>
            ) : packages.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">
                No package details found for this company.
              </p>
            ) : (
              packages.map((pkg, index) => {
                const packageDefinitions = pkg.packages?.packageDefinitions || {};
                const vehicles = pkg.packages?.vehicles || {};
                const vehicleNames = Object.keys(vehicles);

                let terms: string[] = [];

                if (
                  packageDefinitions &&
                  Object.keys(packageDefinitions).length > 0
                ) {
                  terms = [...Object.keys(packageDefinitions), "extraKm", "extraHour"];
                } else {
                  const termsSet = new Set<string>();
                  vehicleNames.forEach((v) =>
                    Object.keys(vehicles[v] || {}).forEach((k) => termsSet.add(k))
                  );
                  terms = Array.from(termsSet);
                }

                return (
                  <div
                    key={`${pkg.packageType}-${index}`}
                    className="mt-8 bg-white border rounded p-4 overflow-x-auto"
                  >
                    <h3 className="text-2xl font-semibold text-[#275981] mb-4">
                      {pkg.packageType} Package Details
                    </h3>

                    <table className="min-w-full border border-gray-300 text-center">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2 text-left">Terms</th>
                          {vehicleNames.map((v) => (
                            <th key={v} className="border px-4 py-2 capitalize">
                              {v}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {terms.map((term) => (
                          <tr key={term}>
                            <td className="border px-4 py-2 text-left font-medium bg-gray-50">
                              {term.startsWith("package") ? (
                                <>
                                  Pkg {term.replace("package", "")} :{" "}
                                  {packageDefinitions[term]?.hours} hrs /{" "}
                                  {packageDefinitions[term]?.km} km
                                </>
                              ) : term === "extraKm" ? (
                                "Extra km"
                              ) : term === "extraHour" ? (
                                "Extra hr"
                              ) : (
                                formatTerm(term)
                              )}
                            </td>

                            {vehicleNames.map((v) => (
                              <td key={v} className="border px-4 py-2">
                                {formatValue(term, vehicles[v]?.[term])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default VehicleDetails;