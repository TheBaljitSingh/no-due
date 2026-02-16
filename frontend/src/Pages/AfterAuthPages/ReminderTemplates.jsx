import React, { useState, useEffect } from 'react';
import api from '../../utils/service/api'; // Use configured api
import { Plus, RefreshCcw, Search, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ReminderTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en',
    components: [
      { type: 'BODY', text: '' },
    ]
  });
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const [variableExamples, setVariableExamples] = useState({});

  // Template Configuration State
  const [templateConfig, setTemplateConfig] = useState({
    beforeDue: { name: '', language: 'en' },
    dueToday: { name: '', language: 'en' },
    overdue: { name: '', language: 'en' }
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchTemplateConfig();
  }, [user]);

  // Extract variables from body text
  useEffect(() => {
    const bodyComponent = newTemplate.components.find(c => c.type === 'BODY');
    if (bodyComponent) {
      const matches = bodyComponent.text.match(/{{(\d+)}}/g);
      if (matches) {
        const indices = matches.map(m => m.match(/\d+/)[0]);
        // Initialize examples for new variables
        setVariableExamples(prev => {
          const next = { ...prev };
          indices.forEach(idx => {
            if (!next[idx]) next[idx] = '';
          });
          return next;
        });
      } else {
        setVariableExamples({});
      }
    }
  }, [newTemplate.components]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/whatsapp/templates'); // Uses baseURL from api.js
      setTemplates(res.data.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateConfig = async () => {
    try {
      const res = await api.get('/v1/whatsapp/template-config');
      if (res.data.data) {
        setTemplateConfig(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch template config", error);
    }
  };

  const saveTemplateConfig = async () => {
    try {
      setSavingConfig(true);
      await api.post('/v1/whatsapp/template-config', templateConfig);
      alert('Template configuration saved successfully!');
    } catch (error) {
      console.error("Failed to save template config", error);
      alert('Failed to save configuration: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    // Prepare payload with examples
    const payload = { ...newTemplate };
    const bodyObj = payload.components.find(c => c.type === 'BODY');

    // Check if we need examples
    const matches = bodyObj.text.match(/{{(\d+)}}/g);
    if (matches) {
      const exampleValues = [];
      // We need to order them by index 1, 2, 3...
      // The regex matches might be out of order or repeated.
      // Meta expects an array of strings in order of occurrence? Or just one example array?
      // Documentation says body_text is [[string, string]]
      // We need to find the max index or just use the extracted indices.
      // Let's assume sequential 1, 2, 3 for simplicity.

      const uniqueIndices = [...new Set(matches.map(m => m.match(/\d+/)[0]))].sort((a, b) => a - b);

      uniqueIndices.forEach(idx => {
        exampleValues.push(variableExamples[idx] || 'example');
      });

      bodyObj.example = { body_text: [exampleValues] };
    }

    try {
      await api.post('/v1/whatsapp/templates', payload);
      setShowCreateModal(false);
      setNewTemplate({ name: '', category: 'UTILITY', language: 'en_US', components: [{ type: 'BODY', text: '' }] });
      setVariableExamples({});
      fetchTemplates();
      alert('Template created successfully!');
    } catch (error) {
      console.error("Failed to create template", error);
      alert('Failed to create template: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreating(false);
    }
  };

  // if (!user?.whatsapp || user.whatsapp.status !== 'connected') {
  //   return (
  //     <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 m-8">
  //       <h2 className="text-xl font-semibold text-gray-800 mb-2">WhatsApp Not Connected</h2>
  //       <p className="text-gray-600 mb-4">Please connect your WhatsApp Business Account to manage templates.</p>
  //       <a href="/nodue/settings/whatsapp" className="text-blue-600 hover:text-blue-800 font-medium">Connect WhatsApp &rarr;</a>
  //     </div>
  //   )
  // }

  if (!templates) {
    return <div>no templates</div>
  }
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );




  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your WhatsApp message templates for reminders.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Template Configuration Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reminder Template Configuration</h2>
            <p className="text-sm text-gray-500 mt-1">Select which template to use for each reminder type</p>
          </div>
          <button
            onClick={saveTemplateConfig}
            disabled={savingConfig}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {savingConfig ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Before Due Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Before Due Reminder
              <span className="ml-1 text-xs text-gray-500">(Future due dates)</span>
            </label>
            <select
              value={templateConfig.beforeDue?.name || ''}
              onChange={(e) => setTemplateConfig(prev => ({
                ...prev,
                beforeDue: { name: e.target.value, language: prev.beforeDue?.language || 'en' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="">Select template...</option>
              {templates.filter(t => t.status === 'APPROVED').map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            {templateConfig?.beforeDue?.name && (
              <p className="mt-1 text-xs text-green-600">✓ {templateConfig.beforeDue.name} ({templateConfig.beforeDue.language})</p>
            )}
          </div>

          {/* Due Today Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Today Reminder
              <span className="ml-1 text-xs text-gray-500">(Due date is today)</span>
            </label>
            <select
              value={templateConfig.dueToday?.name || ''}
              onChange={(e) => setTemplateConfig(prev => ({
                ...prev,
                dueToday: { name: e.target.value, language: prev.dueToday?.language || 'en' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="">Select template...</option>
              {templates.filter(t => t.status === 'APPROVED').map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            {templateConfig.dueToday?.name && (
              <p className="mt-1 text-xs text-green-600">✓ {templateConfig.dueToday.name} ({templateConfig.dueToday.language})</p>
            )}
          </div>

          {/* Overdue Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overdue Reminder
              <span className="ml-1 text-xs text-gray-500">(Past due dates)</span>
            </label>
            <select
              value={templateConfig.overdue?.name || ''}
              onChange={(e) => setTemplateConfig(prev => ({
                ...prev,
                overdue: { name: e.target.value, language: prev.overdue?.language || 'en' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="">Select template...</option>
              {templates.filter(t => t.status === 'APPROVED').map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            {templateConfig.overdue?.name && (
              <p className="mt-1 text-xs text-green-600">✓ {templateConfig.overdue.name} ({templateConfig.overdue.language})</p>
            )}
          </div>
        </div>


      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Search templates..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <button onClick={fetchTemplates} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading templates...</div>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.language}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${t.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          t.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {t.status}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No templates found.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">New Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name (lowercase, no spaces)</label>
                <input
                  type="text"
                  required
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g. payment_reminder_1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                >
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <textarea
                  required
                  value={newTemplate.components.find(c => c.type === 'BODY')?.text || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTemplate(prev => ({
                      ...prev,
                      components: prev.components.map(c => c.type === 'BODY' ? { ...c, text: val } : c)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 h-32"
                  placeholder="Hello {{1}}, your payment of {{2}} is due."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">Use {"{{1}}"}, {"{{2}}"} etc. for variables.</p>
              </div>

              {/* Dynamic Variable Inputs */}
              {Object.keys(variableExamples).length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variable Examples (Required by Meta)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(variableExamples).sort((a, b) => a - b).map(idx => (
                      <div key={idx}>
                        <label className="block text-xs text-gray-500 mb-1">Example for {`{{${idx}}}`}</label>
                        <input
                          type="text"
                          required
                          value={variableExamples[idx]}
                          onChange={(e) => setVariableExamples(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          placeholder={`Content for {{${idx}}}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default ReminderTemplates;
