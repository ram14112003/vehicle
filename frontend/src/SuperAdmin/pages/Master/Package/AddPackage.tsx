import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";
import { showToast, AlertContainer } from "../../../../components/AlertBox";

interface Company {
  companyId: string;
  companyName: string;
}

interface VehicleType {
  vehicleTypeId: string;
  vehicleType: string;
  bookingType?: string;
}

type NumMap = Record<string, number>;

type LocalPackageDef = {
  id: string;
  title: string;
  hours: number;
  km: number;
};

type MonthlyPackageDef = {
  id:
    | "package1"
    | "package2"
    | "package3"
    | "package4"
    | "package5"
    | "package6"
    | "package7"
    | "package8";
  title: string;
  days: number;
  km: number;
};

type LocalState = {
  packageDefinitions: LocalPackageDef[];
  packageRates: Record<string, NumMap>;
  extraKm: NumMap;
  extraHour: NumMap;
};

type MonthlyState = {
  packageDefinitions: MonthlyPackageDef[];
  packageRates: Record<string, NumMap>;
  extraKm: NumMap; // ✅ NEW
  extraHour: NumMap;
};

type OutState = {
  perKm: NumMap;
  driverBattaPerDay: NumMap;
  minimumKmPerDay: NumMap;
};

const DEFAULT_LOCAL_PACKAGES: LocalPackageDef[] = [
  { id: "package1", title: "Pkg 1", hours: 4, km: 40 },
  { id: "package2", title: "Pkg 2", hours: 8, km: 80 },
  { id: "package3", title: "Pkg 3", hours: 12, km: 120 },
  { id: "package4", title: "Pkg 4", hours: 16, km: 160 },
];

const DEFAULT_MONTHLY_PACKAGES: MonthlyPackageDef[] = [
  { id: "package1", title: "Pkg 1", days: 4, km: 400 },
  { id: "package2", title: "Pkg 2", days: 8, km: 800 },
  { id: "package3", title: "Pkg 3", days: 12, km: 1200 },
  { id: "package4", title: "Pkg 4", days: 16, km: 1600 },
  { id: "package5", title: "Pkg 5", days: 20, km: 2000 },
  { id: "package6", title: "Pkg 6", days: 24, km: 2400 },
  { id: "package7", title: "Pkg 7", days: 28, km: 2800 },
  { id: "package8", title: "Pkg 8", days: 30, km: 3000 },
];

const AddPackage: React.FC = () => {
  const [company, setCompany] = useState("");
  const [type, setType] = useState<
    "Out Station" | "Local City Use" | "Monthly Bookings" | ""
  >("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const [localState, setLocalState] = useState<LocalState>({
    packageDefinitions: DEFAULT_LOCAL_PACKAGES,
    packageRates: {},
    extraKm: {},
    extraHour: {},
  });

  const [monthlyState, setMonthlyState] = useState<MonthlyState>({
    packageDefinitions: DEFAULT_MONTHLY_PACKAGES,
    packageRates: {},
    extraKm: {}, // ✅ NEW
    extraHour: {},
  });

  const [outState, setOutState] = useState<OutState>({
    perKm: {},
    driverBattaPerDay: {},
    minimumKmPerDay: {},
  });

  useEffect(() => {
    axiosInstance.get("/company/getAllCompany").then((res) => {
      setCompanies(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    setShowDetails(false);
    setVehicleTypes([]);
  }, [company, type]);

  const initLocalForVehicles = (vehicles: string[]) => {
    const useDefs = DEFAULT_LOCAL_PACKAGES;

    const packageRates: LocalState["packageRates"] = {};
    useDefs.forEach((p) => {
      packageRates[p.id] = {};
      vehicles.forEach((v) => (packageRates[p.id][v] = 0));
    });

    const extraKm: NumMap = {};
    const extraHour: NumMap = {};
    vehicles.forEach((v) => {
      extraKm[v] = 0;
      extraHour[v] = 0;
    });

    setLocalState({
      packageDefinitions: useDefs,
      packageRates,
      extraKm,
      extraHour,
    });
  };

  const initMonthlyForVehicles = (vehicles: string[]) => {
    const packageRates: MonthlyState["packageRates"] = {};
    DEFAULT_MONTHLY_PACKAGES.forEach((p) => {
      packageRates[p.id] = {};
      vehicles.forEach((v) => (packageRates[p.id][v] = 0));
    });

    const extraKm: NumMap = {}; // ✅ NEW
    const extraHour: NumMap = {};
    vehicles.forEach((v) => {
      extraKm[v] = 0;
      extraHour[v] = 0;
    });

    setMonthlyState({
      packageDefinitions: DEFAULT_MONTHLY_PACKAGES,
      packageRates,
      extraKm, // ✅ NEW
      extraHour,
    });
  };

  const initOutForVehicles = (vehicles: string[]) => {
    const makeZeroMap = () => {
      const m: NumMap = {};
      vehicles.forEach((v) => (m[v] = 0));
      return m;
    };

    setOutState({
      perKm: makeZeroMap(),
      driverBattaPerDay: makeZeroMap(),
      minimumKmPerDay: makeZeroMap(),
    });
  };

  const handleGetPackage = async () => {
    if (!company || !type) {
      showToast("Select company and package type", "warn");
      return;
    }

    setLoading(true);
    try {
      const pkgRes = await axiosInstance.post("/package/createPackage", {
        companyId: company,
        packageType: type,
      });

      const packageId =
        pkgRes.data?.data?.packageId || pkgRes.data?.packageInfo?.packageId;

      const vtRes = await axiosInstance.get(
        `/package/getVehicleTypesByPackageId/${packageId}`
      );

      const vehicles = (vtRes.data?.data?.vehicleTypes || []).map(
        (v: VehicleType) => v.vehicleType
      );

      if (!vehicles.length) {
        showToast("No vehicle types found for this booking type.", "warn");
        setVehicleTypes([]);
        setShowDetails(false);
        return;
      }

      setVehicleTypes(vehicles);

      if (type === "Local City Use") initLocalForVehicles(vehicles);
      if (type === "Out Station") initOutForVehicles(vehicles);
      if (type === "Monthly Bookings") initMonthlyForVehicles(vehicles);

      setShowDetails(true);
      showToast("Package loaded", "success");
    } catch {
      showToast("Failed to load package", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!company || !type) return;

    setLoading(true);
    try {
      let packagesPayload: any = {};

      // ✅ LOCAL CITY USE payload
      if (type === "Local City Use") {
        const packageDefinitions: any = {};
        localState.packageDefinitions.forEach((p) => {
          packageDefinitions[p.id] = { hours: p.hours, km: p.km };
        });

        const vehiclesPayload: any = {};
        vehicleTypes.forEach((v) => {
          const row: any = {
            extraKm: localState.extraKm?.[v] ?? 0,
            extraHour: localState.extraHour?.[v] ?? 0,
          };

          localState.packageDefinitions.forEach((p) => {
            row[p.id] = localState.packageRates?.[p.id]?.[v] ?? 0;
          });

          vehiclesPayload[v] = row;
        });

        packagesPayload = { packageDefinitions, vehicles: vehiclesPayload };
      }

      // ✅ OUT STATION payload
      if (type === "Out Station") {
        const vehiclesPayload: any = {};
        vehicleTypes.forEach((v) => {
          vehiclesPayload[v] = {
            perKm: outState.perKm?.[v] ?? 0,
            driverBattaPerDay: outState.driverBattaPerDay?.[v] ?? 0,
            minimumKmPerDay: outState.minimumKmPerDay?.[v] ?? 0,
          };
        });

        packagesPayload = { vehicles: vehiclesPayload };
      }

      // ✅ MONTHLY BOOKINGS payload (Extra Km + Extra Hr)
      if (type === "Monthly Bookings") {
        const packageDefinitions: any = {};
        monthlyState.packageDefinitions.forEach((p) => {
          packageDefinitions[p.id] = { hours: p.days, km: p.km };
        });

        const vehiclesPayload: any = {};
        vehicleTypes.forEach((v) => {
          vehiclesPayload[v] = {
            package1: monthlyState.packageRates.package1?.[v] ?? 0,
            package2: monthlyState.packageRates.package2?.[v] ?? 0,
            package3: monthlyState.packageRates.package3?.[v] ?? 0,
            package4: monthlyState.packageRates.package4?.[v] ?? 0,
            package5: monthlyState.packageRates.package5?.[v] ?? 0,
            package6: monthlyState.packageRates.package6?.[v] ?? 0,
            package7: monthlyState.packageRates.package7?.[v] ?? 0,
            package8: monthlyState.packageRates.package8?.[v] ?? 0,
            extraKm: monthlyState.extraKm?.[v] ?? 0, // ✅ NEW
            extraHour: monthlyState.extraHour?.[v] ?? 0, // ✅ EXTRA HRS
          };
        });

        packagesPayload = { packageDefinitions, vehicles: vehiclesPayload };
      }

      await axiosInstance.post("/packageData/createPackageData", {
        companyId: company,
        packageType: type,
        packages: packagesPayload,
      });

      showToast("Package saved successfully", "success");
      setShowDetails(false);
    } catch {
      showToast("Failed to save package", "error");
    } finally {
      setLoading(false);
    }
  };

  const localColspan = useMemo(
    () => 1 + vehicleTypes.length,
    [vehicleTypes.length]
  );

  return (
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold">Add Package</h1>

        <div className="bg-white p-4 max-w-2xl rounded border mt-4">
          <h2 className="text-xl font-semibold flex gap-2 underline">
            <FontAwesomeIcon icon={faBuilding} /> Package Info
          </h2>

          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="border px-4 py-2 rounded w-full mt-4"
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c.companyId} value={c.companyId}>
                {c.companyName}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-6 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === "Out Station"}
                onChange={() => setType("Out Station")}
              />
              <span>Out Station</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === "Local City Use"}
                onChange={() => setType("Local City Use")}
              />
              <span>Local City Use</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === "Monthly Bookings"}
                onChange={() => setType("Monthly Bookings")}
              />
              <span>Monthly Bookings</span>
            </label>
          </div>

          <button
            disabled={loading}
            onClick={handleGetPackage}
            className="bg-green-600 disabled:opacity-60 text-white px-6 py-2 rounded mt-4"
          >
            {loading ? "Loading..." : "Get Package"}
          </button>
        </div>

        {/* ✅ LOCAL CITY USE */}
        {showDetails && type === "Local City Use" && (
          <div className="bg-white mt-6 p-4 overflow-x-auto rounded border">
            <div className="font-semibold text-gray-700 mb-3">Local Packages</div>

            <table className="border min-w-[1200px] text-center w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-3 text-left w-[260px] min-w-[260px]">
                    Terms
                  </th>
                  {vehicleTypes.map((v) => (
                    <th key={v} className="border px-3 py-3">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {localState.packageDefinitions.map((p) => (
                  <tr key={p.id}>
                    <td className="border px-3 py-3 bg-gray-100 text-left font-semibold">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span>{p.title} :</span>

                        <input
                          type="number"
                          value={p.hours}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setLocalState((prev) => ({
                              ...prev,
                              packageDefinitions: prev.packageDefinitions.map((x) =>
                                x.id === p.id ? { ...x, hours: val } : x
                              ),
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-16 border rounded px-2 py-1 text-center bg-white"
                        />
                        <span>hrs /</span>

                        <input
                          type="number"
                          value={p.km}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setLocalState((prev) => ({
                              ...prev,
                              packageDefinitions: prev.packageDefinitions.map((x) =>
                                x.id === p.id ? { ...x, km: val } : x
                              ),
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-20 border rounded px-2 py-1 text-center bg-white"
                        />
                        <span>km</span>
                      </div>
                    </td>

                    {vehicleTypes.map((v) => (
                      <td key={v} className="border px-2 py-2">
                        <input
                          type="number"
                          value={localState.packageRates?.[p.id]?.[v] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setLocalState((prev) => ({
                              ...prev,
                              packageRates: {
                                ...prev.packageRates,
                                [p.id]: {
                                  ...(prev.packageRates[p.id] || {}),
                                  [v]: val,
                                },
                              },
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-24 border rounded text-center py-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <td className="border px-3 py-3 bg-gray-100 text-left font-semibold">
                    Extra km
                  </td>
                  {vehicleTypes.map((v) => (
                    <td key={v} className="border px-2 py-2">
                      <input
                        type="number"
                        value={localState.extraKm?.[v] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setLocalState((prev) => ({
                            ...prev,
                            extraKm: { ...prev.extraKm, [v]: val },
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-24 border rounded text-center py-1"
                      />
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="border px-3 py-3 bg-gray-100 text-left font-semibold">
                    Extra hr
                  </td>
                  {vehicleTypes.map((v) => (
                    <td key={v} className="border px-2 py-2">
                      <input
                        type="number"
                        value={localState.extraHour?.[v] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setLocalState((prev) => ({
                            ...prev,
                            extraHour: { ...prev.extraHour, [v]: val },
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-24 border rounded text-center py-1"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <button
              disabled={loading}
              onClick={handleSubmit}
              className="bg-green-600 disabled:opacity-60 text-white px-6 py-2 rounded mt-4"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        )}

        {/* ✅ OUT STATION */}
        {showDetails && type === "Out Station" && (
          <div className="bg-white mt-6 p-4 overflow-x-auto rounded border">
            <table className="border min-w-[1200px] text-center w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2 py-2 text-left w-[260px] min-w-[260px]">
                    Terms
                  </th>
                  {vehicleTypes.map((v) => (
                    <th key={v} className="border px-2 py-2">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {[
                  { key: "perKm", label: "Per KM" },
                  { key: "driverBattaPerDay", label: "Driver Batta Per Day" },
                  { key: "minimumKmPerDay", label: "Minimum KM Per Day" },
                ].map((t) => (
                  <tr key={t.key}>
                    <td className="border px-2 py-2 bg-gray-100 font-semibold text-left">
                      {t.label}
                    </td>

                    {vehicleTypes.map((v) => (
                      <td key={v} className="border px-2 py-2">
                        <input
                          type="number"
                          value={(outState as any)[t.key]?.[v] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setOutState((prev) => ({
                              ...prev,
                              [t.key]: {
                                ...(prev as any)[t.key],
                                [v]: val,
                              },
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-24 border rounded text-center py-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              disabled={loading}
              onClick={handleSubmit}
              className="bg-green-600 disabled:opacity-60 text-white px-6 py-2 rounded mt-4"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        )}

        {/* ✅ MONTHLY BOOKINGS */}
        {showDetails && type === "Monthly Bookings" && (
          <div className="bg-white mt-6 p-4 overflow-x-auto rounded border">
            <table className="border min-w-[1200px] text-center w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-3 text-left w-[260px] min-w-[260px]">
                    Terms
                  </th>
                  {vehicleTypes.map((v) => (
                    <th key={v} className="border px-3 py-3">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {monthlyState.packageDefinitions.map((p) => (
                  <tr key={p.id}>
                    <td className="border px-3 py-3 bg-gray-100 text-left font-semibold">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span>{p.title} :</span>

                        <input
                          type="number"
                          value={p.days}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setMonthlyState((prev) => ({
                              ...prev,
                              packageDefinitions: prev.packageDefinitions.map((x) =>
                                x.id === p.id ? { ...x, days: val } : x
                              ),
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-16 border rounded px-2 py-1 text-center bg-white"
                        />
                        <span>days /</span>

                        <input
                          type="number"
                          value={p.km}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setMonthlyState((prev) => ({
                              ...prev,
                              packageDefinitions: prev.packageDefinitions.map((x) =>
                                x.id === p.id ? { ...x, km: val } : x
                              ),
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-20 border rounded px-2 py-1 text-center bg-white"
                        />
                        <span>km</span>
                      </div>
                    </td>

                    {vehicleTypes.map((v) => (
                      <td key={v} className="border px-2 py-2">
                        <input
                          type="number"
                          value={monthlyState.packageRates?.[p.id]?.[v] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setMonthlyState((prev) => ({
                              ...prev,
                              packageRates: {
                                ...prev.packageRates,
                                [p.id]: {
                                  ...(prev.packageRates[p.id] || {}),
                                  [v]: val,
                                },
                              },
                            }));
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-24 border rounded text-center py-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* ✅ NEW: Extra Km Row */}
                <tr>
                  <td className="border px-3 py-3 bg-gray-100 text-left font-semibold">
                    Extra Km
                  </td>
                  {vehicleTypes.map((v) => (
                    <td key={v} className="border px-2 py-2">
                      <input
                        type="number"
                        value={monthlyState.extraKm?.[v] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setMonthlyState((prev) => ({
                            ...prev,
                            extraKm: { ...prev.extraKm, [v]: val },
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-24 border rounded text-center py-1"
                      />
                    </td>
                  ))}
                </tr>

                {/* ✅ NEW: Extra Hr Row */}
                <tr>
                  <td className="border px-3 py-3 bg-gray-100 text-left font-semibold">
                    Extra Hr
                  </td>
                  {vehicleTypes.map((v) => (
                    <td key={v} className="border px-2 py-2">
                      <input
                        type="number"
                        value={monthlyState.extraHour?.[v] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setMonthlyState((prev) => ({
                            ...prev,
                            extraHour: { ...prev.extraHour, [v]: val },
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-24 border rounded text-center py-1"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <button
              disabled={loading}
              onClick={handleSubmit}
              className="bg-green-600 disabled:opacity-60 text-white px-6 py-2 rounded mt-4"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        )}
      </main>

      <AlertContainer />
    </PageLayout>
  );
};

export default AddPackage;