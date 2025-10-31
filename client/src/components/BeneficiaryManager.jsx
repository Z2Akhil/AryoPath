import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, User } from 'lucide-react';
import { 
  getSavedBeneficiaries, 
  saveBeneficiary, 
  deleteBeneficiary, 
  createBeneficiary 
} from '../utils/localStorage';

const BeneficiaryManager = ({ isOpen, onClose, onSelectBeneficiary }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    relationship: 'Self'
  });

  useEffect(() => {
    if (isOpen) {
      loadBeneficiaries();
    }
  }, [isOpen]);

  const loadBeneficiaries = () => {
    const saved = getSavedBeneficiaries();
    setBeneficiaries(saved);
  };

  const handleNewBeneficiary = () => {
    setIsEditing(true);
    setCurrentBeneficiary(null);
    setFormData({
      name: '',
      age: '',
      gender: '',
      relationship: 'Self'
    });
  };

  const handleEditBeneficiary = (beneficiary) => {
    setIsEditing(true);
    setCurrentBeneficiary(beneficiary);
    setFormData({
      name: beneficiary.name,
      age: beneficiary.age,
      gender: beneficiary.gender,
      relationship: beneficiary.relationship
    });
  };

  const handleSaveBeneficiary = () => {
    if (!formData.name.trim()) {
      alert('Please enter beneficiary name');
      return;
    }

    const beneficiaryData = createBeneficiary({
      ...formData,
      id: currentBeneficiary?.id,
      isDefault: formData.relationship === 'Self' 
    });

    if (saveBeneficiary(beneficiaryData)) {
      loadBeneficiaries();
      setIsEditing(false);
      setCurrentBeneficiary(null);
      setFormData({ name: '', age: '', gender: '', relationship: 'Self' });
    } else {
      alert('Failed to save beneficiary');
    }
  };

  const handleDeleteBeneficiary = (beneficiaryId) => {
    if (window.confirm('Are you sure you want to delete this beneficiary?')) {
      if (deleteBeneficiary(beneficiaryId)) {
        loadBeneficiaries();
      } else {
        alert('Failed to delete beneficiary');
      }
    }
  };

  const handleSelectBeneficiary = (beneficiary) => {
    onSelectBeneficiary(beneficiary);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditing ? (currentBeneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary') : 'Manage Beneficiaries'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              // Edit Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Self">Self</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveBeneficiary}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Beneficiary List
              <div className="space-y-4">
                {/* Add New Button */}
                <button
                  onClick={handleNewBeneficiary}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                >
                  <Plus size={20} />
                  <span className="font-medium">Add New Beneficiary</span>
                </button>

                {/* Beneficiaries List */}
                <div className="space-y-3">
                  {beneficiaries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No saved beneficiaries yet</p>
                      <p className="text-sm">Add your first beneficiary to get started</p>
                    </div>
                  ) : (
                    beneficiaries.map((beneficiary) => (
                      <div
                        key={beneficiary.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-800">{beneficiary.name}</h3>
                            {beneficiary.isDefault && (
                              <Star size={16} className="text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-x-3">
                            <span>{beneficiary.age} years</span>
                            <span>•</span>
                            <span>{beneficiary.gender}</span>
                            <span>•</span>
                            <span>{beneficiary.relationship}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSelectBeneficiary(beneficiary)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleEditBeneficiary(beneficiary)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BeneficiaryManager;
