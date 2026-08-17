// pages/master/tax/AddMasterTax.tsx
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../../../components/PageLayout';
import CommonButton from '../../../../components/CommonButton';
import InputBox from '../../../../components/InputBox';
import axiosInstance from '../../../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faPercentage, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { AlertContainer, showToast } from '../../../../components/AlertBox';

export default function AddMasterTax() {
  const [taxName, setTaxName] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  // ✅ Validation Logic
  const validate = (): boolean => {
    if (!taxName.trim()) {
      showToast('Tax Name is required.', 'warn');
      return false;
    }

    // only numbers check for taxName
    if (/^\d+$/.test(taxName.trim())) {
      showToast('Tax Name should contain only letters.', 'warn');
      return false;
    }

    if (!taxPercent.trim()) {
      showToast('Tax Percent is required.', 'warn');
      return false;
    }

    const percent = parseFloat(taxPercent);
    if (isNaN(percent)) {
      showToast('Tax Percent must be a number.', 'warn');
      return false;
    }

    if (percent < 0 || percent > 100) {
      showToast('Tax Percent must be between 0 and 100.', 'warn');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return; // ❌ stop if validation fails

    try {
      const payload = {
        taxName: taxName.trim(),
        taxPercent: parseFloat(taxPercent),
        isActive,
      };

      const response = await axiosInstance.post('/emp/addTax', payload);

      if (response.status === 200 || response.status === 201) {
        showToast('Tax Added Successfully!', 'success');
        setTaxName('');
        setTaxPercent('');
        setIsActive(false);

        setTimeout(() => navigate('/master/tax/list'), 1000);
      } else {
        showToast('Failed to add tax. Please try again.', 'error');
      }
    } catch (error: any) {
     
      // showToast('Error adding tax:', 'error');

      // backend la already irundha error
      if (error.response?.status === 400 && error.response?.data?.message) {
        if (error.response.data.message.toLowerCase().includes("already")) {
          showToast('This Tax Name already exists in the system.', 'warn');
        } else {
          showToast(error.response.data.message, 'error');
        }
      } else {
        showToast('A tax with this name is already added.', 'warn');
      }
    }
  };

  return (
    <>
    <PageLayout>
      <main className=" py-6">
        <h1 className="text-3xl font-bold text-gray-800 ">Add Master Tax</h1>

        <div className="rounded-lg py-3 bg-white">
          <h2 className="text-xl font-semibold text-[#025A64] flex items-center gap-2 py-3 underline">
            <FontAwesomeIcon icon={faFileInvoice} />
            Master Tax Info
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="w-full md:w-1/2">
                <InputBox
                   label={
    <>
      Tax Name <span className="text-red-500">*</span>
    </>
  }
                  name="taxName"
                  placeholder="Enter Tax Name"
                  // required
                  value={taxName}
                  onChange={(name, value) => setTaxName(value)}
                  icon={faTag}
                />
              </div>

              <div className="w-full md:w-1/2">
                <InputBox
                  label={
    <>
      Tax Percent <span className="text-red-500">*</span>
    </>
  }
                  name="taxPercent"
                  placeholder="Enter Tax Percent"
                  type="text"
                  // required
                  value={taxPercent}
                  onChange={(name, value) => setTaxPercent(value)}
                  icon={faPercentage}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  name="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-gray-700">Is Active</label>
              </div>
            </div>

            <div className="flex justify-center sm:pl-44 pt-4">
              <CommonButton text="Submit" type="submit" variant="success" />
            </div>
          </form>
        </div>
      </main>
    </PageLayout>
    <AlertContainer/>
    </>
  );
}
