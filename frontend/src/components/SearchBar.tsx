// // components/SearchBar.tsx
// import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSearch } from '@fortawesome/free-solid-svg-icons';
// import CommonButton from './CommonButton';

// interface SearchBarProps {
//   placeholder?: string;
//   value?: string;
//   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onSearch?: () => void;
//   onlyButton?: boolean;
// }

// const SearchBar: React.FC<SearchBarProps> = ({
//   placeholder = 'Keywords (Order Number, User Name, Payment Mode)',
//   value,
//   onChange,
//   onSearch,
//   onlyButton = false,
// }) => {
//   return (
//     <div className="flex items-center gap-2">
//       {!onlyButton && (
//         <input
//           type="text"
//           placeholder={placeholder}
//           value={value}
//           onChange={onChange}
//           className="px-3 py-2 w-120 border rounded border-gray-300"
//         />
//       )}
//       <CommonButton variant="custom" onClick={onSearch}>
//         <FontAwesomeIcon icon={faSearch} className="mr-2" />
//         Search
//       </CommonButton>
//     </div>
//   );
// };

// export default SearchBar;




// components/SearchBar.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import CommonButton from './CommonButton';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  onlyButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Keywords (Order Number, User Name, Payment Mode)',
  value,
  onChange,
  onSearch,
  onlyButton = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      {!onlyButton && (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="px-3 py-2 w-120 border rounded border-gray-300"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch?.(); // 🔥 Enter press pannina search call aagum
            }
          }}
        />
      )}
      <CommonButton variant="custom" onClick={onSearch}>
        <FontAwesomeIcon icon={faSearch} className="mr-2" />
        Search
      </CommonButton>
    </div>
  );
};

export default SearchBar;
