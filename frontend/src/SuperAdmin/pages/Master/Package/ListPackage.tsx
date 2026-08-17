import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  showToast,
  AlertContainer,
  ActionModal,
} from "../../../../components/AlertBox";

interface Company {
  companyId: string;
  companyName: string;
}

interface PackageDataItem {
  packageDataId: string;
  packageType: string;
  companyId: string;
  packages: any;
  isDeleted: boolean;
  createdAt: string;
}

interface VehicleTypeMaster {
  vehicleTypeId: string;
  vehicleType: string;
  bookingType: string;
  isDeleted?: boolean;
}

const DEFAULT_MONTHLY_PACKAGES = [
  { id: "package1", title: "Pkg 1", days: 4, km: 400 },
  { id: "package2", title: "Pkg 2", days: 8, km: 800 },
  { id: "package3", title: "Pkg 3", days: 12, km: 1200 },
  { id: "package4", title: "Pkg 4", days: 16, km: 1600 },
  { id: "package5", title: "Pkg 5", days: 20, km: 2000 },
  { id: "package6", title: "Pkg 6", days: 24, km: 2400 },
  { id: "package7", title: "Pkg 7", days: 28, km: 2800 },
  { id: "package8", title: "Pkg 8", days: 30, km: 3000 },
] as const;

type NumMap = Record<string, number>;

type LocalDef = { id: string; title: string; hours: number; km: number };

type LocalState = {
  packageDefinitions: LocalDef[];
  packageRates: Record<string, NumMap>;
  extraKm: NumMap;
  extraHour: NumMap;
};

type MonthlyState = {
  packageDefinitions: { id: any; title: string; days: number; km: number }[];
  packageRates: Record<string, NumMap>;
  extraKm: NumMap; // ✅ NEW
  extraHour: NumMap;
};

type OutState = {
  perKm: NumMap;
  driverBattaPerDay: NumMap;
  minimumKmPerDay: NumMap;
};

type PopupType = "confirm-delete";

const safePkgs = (p: any) => {
  try {
    return typeof p === "string" ? JSON.parse(p) : p;
  } catch {
    return {};
  }
};

const mergeVehicleTypes = (master: string[], record: string[]) => {
  const set = new Set<string>();
  const out: string[] = [];

  master.forEach((v) => {
    if (!set.has(v)) {
      set.add(v);
      out.push(v);
    }
  });

  record.forEach((v) => {
    if (!set.has(v)) {
      set.add(v);
      out.push(v);
    }
  });

  return out;
};

const ListPackage: React.FC = () => {
  const [company, setCompany] = useState("");
  const [type, setType] = useState<
    "Out Station" | "Local City Use" | "Monthly Bookings" | ""
  >("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [records, setRecords] = useState<PackageDataItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [masterVehicleTypes, setMasterVehicleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [localState, setLocalState] = useState<LocalState>({
    packageDefinitions: [],
    packageRates: {},
    extraKm: {},
    extraHour: {},
  });

  const [monthlyState, setMonthlyState] = useState<MonthlyState>({
    packageDefinitions: [...DEFAULT_MONTHLY_PACKAGES],
    packageRates: {},
    extraKm: {}, // ✅ NEW
    extraHour: {},
  });

  const [outState, setOutState] = useState<OutState>({
    perKm: {},
    driverBattaPerDay: {},
    minimumKmPerDay: {},
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PopupType>("confirm-delete");

  useEffect(() => {
    axiosInstance.get("/company/getAllCompany?status=0").then((res) => {
      setCompanies(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    setSelectedId("");
    setRecords([]);
    setVehicleTypes([]);
  }, [company, type]);

  const fetchMasterVehicleTypes = async (): Promise<string[]> => {
    try {
      const res = await axiosInstance.get("/vehicleType/getAllVehicleType", {
        params: { status: 0 },
      });

      const list: VehicleTypeMaster[] = res.data?.data || [];
      const names = list
        .filter((x) => !x.isDeleted)
        .map((x) => String(x.vehicleType));

      setMasterVehicleTypes(names);
      return names;
    } catch {
      setMasterVehicleTypes([]);
      return [];
    }
  };

  // ✅ Local City Use dynamic add/remove package row helpers
  const nextLocalPkg = (defs: LocalDef[]) => {
    const nums = defs
      .map((d) => Number(String(d.id).replace("package", "")))
      .filter((n) => Number.isFinite(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return {
      id: `package${next}`,
      title: `Pkg ${next}`,
      hours: 0,
      km: 0,
    } as LocalDef;
  };

  const handleAddLocalRow = () => {
    if (type !== "Local City Use") return;

    setLocalState((prev) => {
      const newPkg = nextLocalPkg(prev.packageDefinitions);

      const nextRates = { ...prev.packageRates, [newPkg.id]: {} as NumMap };
      vehicleTypes.forEach((v) => (nextRates[newPkg.id][v] = 0));

      return {
        ...prev,
        packageDefinitions: [...prev.packageDefinitions, newPkg],
        packageRates: nextRates,
      };
    });
  };

  const handleRemoveLocalRow = (pkgId: string) => {
    const n = Number(String(pkgId).replace("package", ""));
    if (n <= 4) {
      showToast("Pkg 1 - Pkg 4 cannot be removed", "warn");
      return;
    }

    setLocalState((prev) => {
      const defs = prev.packageDefinitions.filter((p) => p.id !== pkgId);
      const rates = { ...prev.packageRates };
      delete rates[pkgId];
      return { ...prev, packageDefinitions: defs, packageRates: rates };
    });
  };

  const hydrateFromRecord = (rec: PackageDataItem, masterList?: string[]) => {
    const pkgs = safePkgs(rec.packages);

    const vehObj = pkgs?.vehicles || {};
    const recordVts = Object.keys(vehObj || {});
    const mergedVts = mergeVehicleTypes(
      masterList ?? masterVehicleTypes,
      recordVts
    );

    setVehicleTypes(mergedVts);

    if (type === "Local City Use") {
      const defsObj = pkgs?.packageDefinitions || {};
      const keys = Object.keys(defsObj || {}).sort((a, b) => {
        const na = Number(String(a).replace("package", ""));
        const nb = Number(String(b).replace("package", ""));
        return na - nb;
      });

      const defsArr: LocalDef[] = keys.map((id) => {
        const n = Number(String(id).replace("package", ""));
        return {
          id,
          title: `Pkg ${Number.isFinite(n) ? n : id}`,
          hours: Number(defsObj?.[id]?.hours ?? 0),
          km: Number(defsObj?.[id]?.km ?? 0),
        };
      });

      const packageRates: any = {};
      defsArr.forEach((p) => {
        packageRates[p.id] = {};
        mergedVts.forEach((v) => {
          packageRates[p.id][v] = Number(vehObj?.[v]?.[p.id] ?? 0);
        });
      });

      const extraKm: any = {};
      const extraHour: any = {};
      mergedVts.forEach((v) => {
        extraKm[v] = Number(vehObj?.[v]?.extraKm ?? 0);
        extraHour[v] = Number(vehObj?.[v]?.extraHour ?? 0);
      });

      setLocalState({
        packageDefinitions: defsArr,
        packageRates,
        extraKm,
        extraHour,
      });
    }

    if (type === "Out Station") {
      const mapFor = (
        k: "perKm" | "driverBattaPerDay" | "minimumKmPerDay"
      ) => {
        const m: any = {};
        mergedVts.forEach((v) => (m[v] = Number(vehObj?.[v]?.[k] ?? 0)));
        return m;
      };

      setOutState({
        perKm: mapFor("perKm"),
        driverBattaPerDay: mapFor("driverBattaPerDay"),
        minimumKmPerDay: mapFor("minimumKmPerDay"),
      });
    }

if (type === "Monthly Bookings") {
  const defsObj = pkgs?.packageDefinitions || {};

  // ✅ dynamic keys eduthutu sort panrom
  const keys = Object.keys(defsObj || {}).sort((a, b) => {
    const na = Number(String(a).replace("package", ""));
    const nb = Number(String(b).replace("package", ""));
    return na - nb;
  });

  // ✅ backend la irukura ella packages create pannum
  const defsArr = keys.map((id) => {
    const n = Number(String(id).replace("package", ""));
    return {
      id,
      title: `Pkg ${Number.isFinite(n) ? n : id}`,
      days: Number(defsObj?.[id]?.hours ?? 0),
      km: Number(defsObj?.[id]?.km ?? 0),
    };
  });

  const packageRates: any = {};
  defsArr.forEach((p) => {
    packageRates[p.id] = {};
    mergedVts.forEach((v) => {
      packageRates[p.id][v] = Number(vehObj?.[v]?.[p.id] ?? 0);
    });
  });

  const extraKm: any = {};
  const extraHour: any = {};
  mergedVts.forEach((v) => {
    extraKm[v] = Number(vehObj?.[v]?.extraKm ?? 0);
    extraHour[v] = Number(vehObj?.[v]?.extraHour ?? 0);
  });

  setMonthlyState({
    packageDefinitions: defsArr as any,
    packageRates,
    extraKm,
    extraHour,
  });
}
  };

  // ✅ Monthly dynamic add/remove helpers
const nextMonthlyPkg = (defs: MonthlyState["packageDefinitions"]) => {
  const nums = defs
    .map((d) => Number(String(d.id).replace("package", "")))
    .filter((n) => Number.isFinite(n));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;

  return {
    id: `package${next}`,
    title: `Pkg ${next}`,
    days: 0,
    km: 0,
  };
};

const handleAddMonthlyRow = () => {
  if (type !== "Monthly Bookings") return;

  setMonthlyState((prev) => {
    const newPkg = nextMonthlyPkg(prev.packageDefinitions);

    const nextRates = { ...prev.packageRates, [newPkg.id]: {} as NumMap };

    vehicleTypes.forEach((v) => (nextRates[newPkg.id][v] = 0));

    return {
      ...prev,
      packageDefinitions: [...prev.packageDefinitions, newPkg],
      packageRates: nextRates,
    };
  });
};


const handleRemoveMonthlyRow = (pkgId: string) => {
  const n = Number(String(pkgId).replace("package", ""));
  if (n <= 8) {
    showToast("Pkg 1 - Pkg 8 cannot be removed", "warn");
    return;
  }

  setMonthlyState((prev) => {
    const defs = prev.packageDefinitions.filter((p) => p.id !== pkgId);
    const rates = { ...prev.packageRates };
    delete rates[pkgId];
    return { ...prev, packageDefinitions: defs, packageRates: rates };
  });
};

  const handleGetPackage = async () => {
    if (!company) return showToast("Please select a company.", "warn");
    if (!type) return showToast("Please select a package type.", "warn");

    setLoading(true);
    try {
      const master = await fetchMasterVehicleTypes();
      const res = await axiosInstance.get("/packageData/getAllPackageData", {
        params: { companyId: company, packageType: type },
      });

      const list: PackageDataItem[] = (res.data?.data || []).filter(
        (x: any) => !x.isDeleted
      );
      setRecords(list);

      if (!list.length) {
        setSelectedId("");
        setVehicleTypes([]);
        showToast("No data found. Create from Add Package page.", "info");
        return;
      }

      setSelectedId(list[0].packageDataId);
      hydrateFromRecord(list[0], master);
      showToast("Package loaded", "success");
    } catch (e: any) {
      showToast(e.response?.data?.message || "Failed to get package data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    const rec = records.find((r) => r.packageDataId === selectedId);
    if (rec) hydrateFromRecord(rec, masterVehicleTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, type, records]);

  const buildPayload = () => {
    if (type === "Local City Use") {
      const packageDefinitions: any = {};
      localState.packageDefinitions.forEach((p) => {
        packageDefinitions[p.id] = { hours: p.hours, km: p.km };
      });

      const vehicles: any = {};
      vehicleTypes.forEach((v) => {
        const row: any = {
          extraKm: localState.extraKm?.[v] ?? 0,
          extraHour: localState.extraHour?.[v] ?? 0,
        };

        localState.packageDefinitions.forEach((p) => {
          row[p.id] = localState.packageRates?.[p.id]?.[v] ?? 0;
        });

        vehicles[v] = row;
      });

      return { packageDefinitions, vehicles };
    }

    if (type === "Monthly Bookings") {
      const packageDefinitions: any = {};
      monthlyState.packageDefinitions.forEach((p) => {
        packageDefinitions[p.id] = { hours: p.days, km: p.km };
      });

      const vehicles: any = {};
     vehicleTypes.forEach((v) => {
  const row: any = {
    extraKm: monthlyState.extraKm?.[v] ?? 0,
    extraHour: monthlyState.extraHour?.[v] ?? 0,
  };

  monthlyState.packageDefinitions.forEach((p) => {
    row[p.id] = monthlyState.packageRates?.[p.id]?.[v] ?? 0;
  });

  vehicles[v] = row;
});

      return { packageDefinitions, vehicles };
    }

    const vehicles: any = {};
    vehicleTypes.forEach((v) => {
      vehicles[v] = {
        perKm: outState.perKm?.[v] ?? 0,
        driverBattaPerDay: outState.driverBattaPerDay?.[v] ?? 0,
        minimumKmPerDay: outState.minimumKmPerDay?.[v] ?? 0,
      };
    });
    return { vehicles };
  };

  const handleSave = async () => {
    if (!selectedId) return showToast("No record selected", "warn");

    setLoading(true);
    try {
      const payload = {
        companyId: company,
        packageType: type,
        packages: buildPayload(),
      };

      await axiosInstance.put(`/packageData/updatePackageData/${selectedId}`, payload);
      showToast("Updated successfully!", "success");
      await handleGetPackage();
    } catch (e: any) {
      showToast(e.response?.data?.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setModalOpen(true);
    setModalType("confirm-delete");
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    setLoading(true);
    try {
      await axiosInstance.delete(`/packageData/deletePackageData/${selectedId}`);
      showToast("Deleted successfully!", "success");
      setModalOpen(false);
      await handleGetPackage();
    } catch (e: any) {
      showToast(e.response?.data?.message || "Delete failed", "error");
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
        <h1 className="text-3xl font-bold text-gray-800">List Package</h1>

        <div className="max-w-2xl bg-white py-3">
          <h2 className="text-xl font-semibold text-[#275981] flex items-center gap-2 py-3 underline">
            <FontAwesomeIcon icon={faBuilding} /> Package Info
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block mb-2">Company *</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="border px-4 py-2 rounded w-full"
                disabled={loading}
              >
                <option value="">Select Company</option>
                {companies.map((comp) => (
                  <option key={comp.companyId} value={comp.companyId}>
                    {comp.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Package Type *</label>
              <div className="flex flex-wrap gap-6">
                <label>
                  <input
                    type="radio"
                    checked={type === "Out Station"}
                    onChange={() => setType("Out Station")}
                    disabled={loading}
                  />
                  <span className="ml-2">Out Station</span>
                </label>

                <label>
                  <input
                    type="radio"
                    checked={type === "Local City Use"}
                    onChange={() => setType("Local City Use")}
                    disabled={loading}
                  />
                  <span className="ml-2">Local City Use</span>
                </label>

                <label>
                  <input
                    type="radio"
                    checked={type === "Monthly Bookings"}
                    onChange={() => setType("Monthly Bookings")}
                    disabled={loading}
                  />
                  <span className="ml-2">Monthly Bookings</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGetPackage}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Loading..." : "Get Package"}
            </button>
          </div>
        </div>

        {!!selectedId && (
          <div className="mt-6 bg-white p-4 rounded border overflow-x-auto">
            {/* ✅ LOCAL CITY USE */}
            {type === "Local City Use" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-700">Local Packages</div>

                  <button
                    type="button"
                    onClick={handleAddLocalRow}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={loading}
                  >
                    + Add Package Row
                  </button>
                </div>

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
                    {localState.packageDefinitions.map((p) => {
                      const n = Number(String(p.id).replace("package", ""));
                      const canRemove = Number.isFinite(n) && n > 4;

                      return (
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
                                className="w-12 border rounded px-1 py-1 text-center bg-white"
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
                                className="w-16 border rounded px-2 py-1 text-center bg-white"
                              />
                              <span>km</span>

                              {canRemove && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLocalRow(p.id)}
                                  className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                  title="Remove this package row"
                                >
                                  Remove
                                </button>
                              )}
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
                      );
                    })}

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
              </>
            )}

            {/* ✅ OUT STATION */}
            {type === "Out Station" && (
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
                                [t.key]: { ...(prev as any)[t.key], [v]: val },
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
            )}

<div className="flex items-center justify-between mb-3">
  <div className="font-semibold text-gray-700">Monthly Packages</div>

  <button
    type="button"
    onClick={handleAddMonthlyRow}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    disabled={loading}
  >
    + Add Package Row
  </button>
</div>

            {/* ✅ MONTHLY BOOKINGS */}
            {type === "Monthly Bookings" && (
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
                 {monthlyState.packageDefinitions.map((p) => {

  const n = Number(String(p.id).replace("package", ""));
  const canRemove = Number.isFinite(n) && n > 8;

  return (
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
            className="w-12 border rounded px-1 py-1 text-center bg-white"
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
            className="w-16 border rounded px-2 py-1 text-center bg-white"
          />

          <span>km</span>

          {/* ✅ REMOVE BUTTON */}
          {canRemove && (
            <button
              type="button"
              onClick={() => handleRemoveMonthlyRow(p.id)}
              className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
            >
              Remove
            </button>
          )}

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
            className="w-24 border rounded text-center py-1"
          />
        </td>
      ))}
    </tr>
  );
})}

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
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>

              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </main>

      <AlertContainer />

      <ActionModal
        isOpen={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName="this package"
      />
    </PageLayout>
  );
};

export default ListPackage;