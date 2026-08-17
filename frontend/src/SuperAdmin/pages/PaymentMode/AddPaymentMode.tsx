// import React, { FormEvent, useState } from 'react';
// import PageLayout from '../../../components/PageLayout';
// import InputBox, { getFormStore } from '../../../components/InputBox';
// import CommonButton from '../../../components/CommonButton';
// import { showToast, AlertContainer } from '../../../components/AlertBox';
// import axiosInstance from '../../../utils/axiosInstance';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import {
//   faCreditCard,
//   faSortNumericDown,
//   faGlobe,
//   faCheckCircle,

// } from '@fortawesome/free-solid-svg-icons';
// import { useNavigate } from 'react-router-dom';

// export default function AddPaymentMode() {
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//  const handleSubmit = async (e: FormEvent) => {
//   e.preventDefault();
//   const form = getFormStore();

//   // Validation
//   if (!form.modeName?.trim() || !form.sortOrder?.trim()) {
//     showToast('Please fill in all required fields.', 'error');
//     return;
//   }

//   try {
//     setLoading(true);

//     const payload = {
//       modelname: form.modeName,
//       sortorder: form.sortOrder,
//       isOnline: Boolean(form.isOnline),
//       isActive: Boolean(form.isActive),
//     };

//     const response = await axiosInstance.post(
//       "/paymentmode/createPaymentMode",
//       payload
//     );
  

//     showToast("Payment Mode Added Successfully!", "success");
//     navigate('/paymentmode/list');
//   } catch (error: any) {
//     console.error("API Error:", error.response?.data || error.message);
//     showToast("Payment mode with this name already exists.", "error");
//   } finally {
//     setLoading(false);
//   }
// };


//   return (
//     <PageLayout>
//       <main className="py-6">
//         {/* Toast Container */}
//         <AlertContainer />

//         <h1 className="text-3xl font-bold text-gray-800">Add Payment Mode</h1>
//         <h2 className="text-lg font-semibold text-[#275981] py-5 underline">
//           <FontAwesomeIcon icon={faCreditCard} /> Payment Mode Info</h2>

//         <div className="">

//           <form onSubmit={handleSubmit}>
//             {/* Input Fields */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-4xl">
//               <InputBox
//                 label="Mode Name"
//                 name="modeName"
//                 required
//                 placeholder="Enter Mode Name"
//                 icon={faCreditCard}
//               />
//               <InputBox
//                 label="Sort Order"
//                 name="sortOrder"
//                 required
//                 placeholder="Enter Sort Order"
//                 icon={faSortNumericDown}
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-4xl">
//               <InputBox
//                 type="checkbox"
//                 name="isOnline"
//                 label="Is Online"
//                 icon={faGlobe}
//               />
//               <InputBox
//                 type="checkbox"
//                 name="isActive"
//                 label="Is Active"
//                 icon={faCheckCircle}
//               // defaultValue={false}
//               />
//             </div>
//             <div className="flex justify-end ">
//               <CommonButton type="submit" variant="success" loading={loading}>
//                 Submit
//               </CommonButton>
//             </div>
//           </form>

//         </div>
//       </main>
//     </PageLayout>
//   );
// }



import React, { FormEvent, useState } from 'react';
import PageLayout from '../../../components/PageLayout';
import InputBox, { getFormStore } from '../../../components/InputBox';
import CommonButton from '../../../components/CommonButton';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import axiosInstance from '../../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faGlobe,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export default function AddPaymentMode() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = getFormStore();

    // ✅ Validation (Sort Order removed)
    if (!form.modeName?.trim()) {
      showToast('Please enter Mode Name.', 'error');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        modelname: form.modeName,
        isOnline: Boolean(form.isOnline),
        isActive: Boolean(form.isActive),
      };

      await axiosInstance.post(
        "/paymentmode/createPaymentMode",
        payload
      );

      showToast("Payment Mode Added Successfully!", "success");
      navigate('/paymentmode/list');
    } catch (error: any) {
      console.error("API Error:", error.response?.data || error.message);
      showToast("Payment mode with this name already exists.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <main className="py-6">
        <AlertContainer />

        <h1 className="text-3xl font-bold text-gray-800">
          Add Payment Mode
        </h1>

        <h2 className="text-lg font-semibold text-[#275981] py-5 underline">
          <FontAwesomeIcon icon={faCreditCard} /> Payment Mode Info
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-4xl">
            <InputBox
              label="Mode Name"
              name="modeName"
              required
              placeholder="Enter Mode Name"
              icon={faCreditCard}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-4xl">
            <InputBox
              type="checkbox"
              name="isOnline"
              label="Is Online"
              icon={faGlobe}
            />
            <InputBox
              type="checkbox"
              name="isActive"
              label="Is Active"
              icon={faCheckCircle}
            />
          </div>

          <div className="flex justify-end">
            <CommonButton
              type="submit"
              variant="success"
              loading={loading}
            >
              Submit
            </CommonButton>
          </div>
        </form>
      </main>
    </PageLayout>
  );
}
