import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import PageLayout from '../../../components/PageLayout';
import { showToast,AlertContainer } from '../../../components/AlertBox';

const EditMainTemplate: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultContent = `
    <div style="text-align: center;">
      <h2>###WEB_SITE_NAME###</h2>
      <div>###EmailContent###</div>
      <p>Thank you.<br/>###WEB_SITE_NAME### Team</p>
    </div>
  `;

  const [content, setContent] = useState(defaultContent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    showToast("Main template saved!","success");
  };

  const handleReset = () => {
    setContent(defaultContent);
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-6xl mx-auto p-8 ">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Email Config Main Content</h2>

        <p className="text-gray-600 mb-1">Main Template (<strong>Code: MAIN_TEMPLATE</strong>)</p>
        <p className="text-sm text-red-500 mb-6">Note: All other email templates will use this outer layout</p>

        <form onSubmit={handleSubmit}>
          <Editor
            // apiKey="5cxmnr0pn9j08n8sasynohd5mkr2td49kgwxi57qp7w30n63"
            apiKey="bhto93vsvi75puou003n69ljnuc07nygsyci5mizzpl04v54"
            value={content}
            onEditorChange={(newValue) => setContent(newValue)}
            init={{
              height: 500,
              menubar: true,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                'fullscreen', 'insertdatetime', 'media', 'table', 'emoticons',
                'help', 'wordcount'
              ],
              toolbar:
                'undo redo | styleselect | fontfamily fontsize | ' +
                'bold italic underline strikethrough forecolor backcolor | ' +
                'alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | link image media table emoticons | ' +
                'attachFile | removeformat preview code fullscreen',
              setup: (editor: any) => {  //  FIX: use 'any' here to avoid TS error
                editor.ui.registry.addButton('attachFile', {
                  icon: 'upload',
                  tooltip: 'Attach File',
                  onAction: () => fileInputRef.current?.click(),
                });
              }
            }}
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
               
                showToast(`File selected: ${e.target.files[0].name}`,"success");
              }
            }}
          />

          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Reset to Default Message
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default EditMainTemplate;
