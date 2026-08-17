//API INTEGRATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../../components/PageLayout';
import { DataTable, Column } from '../../../components/DataTable';
import axiosInstance from '../../../utils/axiosInstance'; 
import SearchBar from '../../../components/SearchBar'; 

// Interface mapping backend fields
interface EmailConfig {
  emailConfigId: string;
  title: string;
  emailCode: string;
  subject: string;
  message: string;
  fromName: string;
  fromAddress: string;
  emailBcc: string;
  createdAt: string;
}

const EmailConfiguration: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // 🔹 Fetch API data
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/emailConfRoutes/getAllEmailConf');
        setConfigs(res.data.emailConfs || []);
      } catch (err: any) {
       
        setError('Failed to load email configurations');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  // 🔹 Search filter
  const filteredConfigs = configs.filter(row =>
    row.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    row.emailCode?.toLowerCase().includes(searchText.toLowerCase()) ||
    row.fromName?.toLowerCase().includes(searchText.toLowerCase()) ||
    row.fromAddress?.toLowerCase().includes(searchText.toLowerCase())
  );

  // 🔹 Edit handlers
  const handleEdit = (row: EmailConfig) => {
    navigate(`/email/configurations/edit/${row.emailConfigId}`);
  };

  const handleSearch = () => {
    // No API call, filter is reactive
  };

  const handleEditMainTemplate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/email/configurations/edit-main-template');
  };

  // 🔹 Table columns
  const columns: Column<EmailConfig>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Email Code', accessor: 'emailCode' },
    { header: 'From', accessor: 'fromName' },
    // { header: 'From Address', accessor: 'fromAddress' },
    // { header: 'BCC', accessor: 'emailBcc' },
  ];

  return (
    <PageLayout>
      <div className="py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">List Email Configuration</h1>
          <a
            href="#"
            onClick={handleEditMainTemplate}
            className="text-blue-600 hover:underline font-medium"
          >
            Edit Main Template
          </a>
        </div>

        {/* ✅ Replaced with SearchBar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Keywords (Email Configuration Name)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        {/* Table */}
        <div>
          {loading ? (
            <p className="text-gray-600">Loading email configurations...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredConfigs}
              onEdit={handleEdit}
              rowsPerPage={5}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default EmailConfiguration;
