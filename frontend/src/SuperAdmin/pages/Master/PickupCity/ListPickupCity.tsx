import React, { useState, useEffect } from "react";
import PageLayout from "../../../../components/PageLayout";
import { DataTable, Column } from "../../../../components/DataTable";
import CommonButton from "../../../../components/CommonButton";
import InputBox from "../../../../components/InputBox";
import SearchBar from "../../../../components/SearchBar";
import TrashToggleButton from "../../../../components/TrashToggleButton";
import { ActionModal, showToast } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";
import { faCity } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// ✅ Import country-state-city package
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";

interface PickupCity {
  _id: string;
  city: string;
  country: string;
  state: string;
  isPickup: string; // For display
  isTrashed: boolean;
}

const ListPickupCity: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<PickupCity[]>([]);
  const [trashedCities, setTrashedCities] = useState<PickupCity[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any | null>(null);

  // Delete Modal
  const [modalType, setModalType] = useState<"confirm-delete" | null>(null);
  const [targetRow, setTargetRow] = useState<any | null>(null);

  // ✅ Dropdown data
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [citiesDropdown, setCitiesDropdown] = useState<ICity[]>([]);

  // Fetch all cities
  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<{ data: any[] }>(
        "/city/listCity"
      );
      const mappedCities: PickupCity[] = response.data.data.map((item: any) => ({
        _id: item.cityId,
        city: item.pickupCity || "",
        country: item.country || "",
        state: item.state || "",
        isPickup:
          item.isPickupCity === "yes" || item.isPickupCity === "1"
            ? "Yes"
            : "No",
        isTrashed: item.isTrashed || false,
      }));
      setCities(mappedCities.filter((c) => !c.isTrashed));
      setTrashedCities(mappedCities.filter((c) => c.isTrashed));
    } catch (error) {
      showToast("Error fetching pickup cities", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
    // load only India
    const india = Country.getAllCountries().find((c) => c.name === "India");
    if (india) {
      setCountries([india]); // ✅ only India
    }
  }, []);


  // Global Search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCities();
      return;
    }

    try {
      const res = await axiosInstance.get("/globalsearch", {
        params: {
          model: "pickupcity",
          keyword: searchTerm,
          isDeleted: showTrash ? "1" : "0",
        },
      });

      if (Array.isArray(res.data)) {
        const mappedCities = res.data.map((item: any) => ({
          _id: item.cityId,
          city: item.pickupCity || "",
          country: item.country || "",
          state: item.state || "",
          isPickup:
            item.isPickupCity === "yes" || item.isPickupCity === "1"
              ? "Yes"
              : "No",
          isTrashed: showTrash,
        }));
        showTrash ? setTrashedCities(mappedCities) : setCities(mappedCities);
      } else {
        showTrash ? setTrashedCities([]) : setCities([]);
      }
    } catch (err) {
      showToast("Search API failed:", "error");
    }
  };

  const currentData = showTrash ? trashedCities : cities;

  // Table Columns
  const columns: Column<PickupCity>[] = [
    { header: "Pickup City", accessor: "city" },
    { header: "Country", accessor: "country" },
    { header: "State", accessor: "state" },
    { header: "Is Pickup City", accessor: "isPickup" },
  ];

  const displayColumns = showTrash
    ? columns.filter(
      (col) => col.accessor === "city" || col.accessor === "isPickup"
    )
    : columns;

  // ✅ Edit
  const handleEdit = async (row: PickupCity) => {
    try {
      const response = await axiosInstance.get<{ data: any }>(
        `/city/getPickupCityById/${row._id}`
      );
      const cityData = response.data.data;
      setEditForm({
        _id: cityData.cityId,
        city: cityData.pickupCity || "",
        country: cityData.country || "",
        state: cityData.state || "",
        isPickup:
          cityData.isPickupCity === "yes" || cityData.isPickupCity === "1",
        isTrashed: cityData.isTrashed || false,
      });

      // preload states and cities for selected country/state
      const countryIso = Country.getAllCountries().find(
        (c) => c.name === cityData.country
      )?.isoCode;
      if (countryIso) {
        setStates(State.getStatesOfCountry(countryIso));
        const stateIso = State.getStatesOfCountry(countryIso).find(
          (s) => s.name === cityData.state
        )?.isoCode;
        if (stateIso) {
          setCitiesDropdown(City.getCitiesOfState(countryIso, stateIso));
        }
      }

      setIsEditOpen(true);
    } catch (error) {
      showToast("Failed to fetch city details.", "error");
    }
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditForm(null);
    setStates([]);
    setCitiesDropdown([]);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    try {
      await axiosInstance.put(`/city/pickupCityUpdate/${editForm._id}`, {
        pickupCity: editForm.city,
        country: editForm.country,
        state: editForm.state,
        isPickupCity: editForm.isPickup ? "yes" : "no",
      });
      showToast("City updated successfully!", "success");
      fetchCities();
      closeEdit();
    } catch (error) {
      showToast("Error updating city:", "error");
    }
  };

  // ✅ Dropdown change handlers
  const handleCountryChange = (name: string, value: string) => {
    const selectedCountry = countries.find((c) => c.name === value);
    setEditForm((prev: any) => ({
      ...prev,
      country: value,
      state: "",
      city: "",
    }));
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      setCitiesDropdown([]);
    }
  };

  const handleStateChange = (name: string, value: string) => {
    const selectedState = states.find((s) => s.name === value);
    const countryIso = countries.find(
      (c) => c.name === editForm.country
    )?.isoCode;
    setEditForm((prev: any) => ({ ...prev, state: value, city: "" }));
    if (countryIso && selectedState) {
      setCitiesDropdown(City.getCitiesOfState(countryIso, selectedState.isoCode));
    }
  };

  const handleCityChange = (name: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, city: value }));
  };

  // Delete
  const handleDelete = (row: PickupCity) => {
    setTargetRow(row);
    setModalType("confirm-delete");
  };

  const confirmDelete = async () => {
    if (!targetRow) return;
    try {
      await axiosInstance.delete(`/city/pickupCityDelete/${targetRow._id}`);
      showToast("City moved to trash successfully!", "success");
      // fetchCities();
      setCities((prev) => prev.filter((c) => c._id !== targetRow._id));
    setTrashedCities((prev) => [...prev, { ...targetRow, isTrashed: true }]);
    } catch (error) {
      showToast("Error deleting city. Please try again.", "error");
    } finally {
      setModalType(null);
      setTargetRow(null);
    }
  };

  // Restore
  const handleRestore = async (row: PickupCity) => {
    try {
      await axiosInstance.put(`/city/pickupCityRestore/${row._id}`);
      showToast("City restored successfully!", "success");
      setTrashedCities((prev) => prev.filter((city) => city._id !== row._id));
      setCities((prev) => [...prev, { ...row, isTrashed: false }]);
    } catch (error) {
      showToast("Error restoring city. Please try again.", "error");
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeEdit();
        setModalType(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <PageLayout>
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          List Pickup City {showTrash ? " - (Trashed)" : ""}
        </h1>

        <div className="flex-1 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <SearchBar
                placeholder="Search Pickup City"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
              />
            </div>

            <TrashToggleButton
              showTrashed={showTrash}
              onToggle={() => setShowTrash((prev) => !prev)}
            />
          </div>

          <DataTable
            key={searchTerm + showTrash + currentData.length}
            columns={displayColumns}
            data={currentData}
            loading={loading}
            onRestore={showTrash ? handleRestore : undefined}
            onEdit={!showTrash ? handleEdit : undefined}
            onDelete={!showTrash ? handleDelete : undefined}
            rowsPerPage={5}
          />
        </div>
        {isEditOpen && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="absolute inset-0" onClick={closeEdit}></div>
            <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg flex flex-col max-h-[90vh]">
             
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center">
                  <FontAwesomeIcon icon={faCity} className="mr-2" />
                  Edit Pickup City
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
                <InputBox
                  label="Country"
                  name="country"
                  type="select"
                  value={editForm.country}
                  onChange={handleCountryChange}
                  options={countries.map((c: ICountry) => ({
                    value: c.name,
                    label: c.name,
                  }))}
                  placeholder="Select Country"
                />
                <InputBox
                  label="State"
                  name="state"
                  type="select"
                  value={editForm.state}
                  onChange={handleStateChange}
                  options={states.map((s: IState) => ({
                    value: s.name,
                    label: s.name,
                  }))}
                  placeholder="Select State"
                  disabled={!editForm.country}
                />
              <InputBox
  label="Pickup City"
  name="city"
  type="text"
  value={editForm.city}
  onChange={(name, value) =>
    setEditForm((prev: any) => ({ ...prev, city: value }))
  }
  placeholder="Enter Pickup City"
/>

             
                <div className="flex items-center space-x-2">
                  <input
                    id="isPickup"
                    name="isPickup"
                    type="checkbox"
                    checked={editForm.isPickup}
                    onChange={(e) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        isPickup: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="isPickup"
                    className="text-sm font-medium text-gray-700"
                  >
                    Is Pickup City
                  </label>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-2 bg-white">
                <CommonButton text="Cancel" onClick={closeEdit} variant="secondary" />
                <CommonButton text="Save" onClick={saveEdit} variant="success" />
              </div>
            </div>

          </div>
        )}

        {/* Delete Modal */}
        <ActionModal
          isOpen={modalType !== null}
          type={modalType as any}
          onClose={() => {
            setModalType(null);
            setTargetRow(null);
          }}
          onConfirm={confirmDelete}
        />
      </main>
    </PageLayout>
  );
};

export default ListPickupCity;
