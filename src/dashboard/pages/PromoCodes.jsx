import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Calendar, Users, Home, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { 
  getCodesPromo, 
  createCodePromo, 
  updateCodePromo, 
  deleteCodePromo 
} from '../../services/promoCodesService';
import roomsService from '../../services/roomService';

const PromoCodes = () => {
  const [codes, setCodes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    applicableToAll: true,
    chambres: [],
    dateDebut: '',
    dateFin: '',
    utilisationMax: 100,
    minimumStay: 1,
    statut: 'actif'
  });

  useEffect(() => {
    loadCodes();
    loadRooms();
  }, []);

  // Fonction utilitaire pour formater les dates
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  };

  const loadCodes = async () => {
    try {
      console.log('🔄 Chargement des codes promo...');
      
      const response = await getCodesPromo();
      console.log('📦 Réponse complète:', response);
      
      let codesData = [];
      
      if (response.data && Array.isArray(response.data)) {
        codesData = response.data;
      } else if (response.data && response.data.codesPromo) {
        codesData = response.data.codesPromo;
      } else if (response.codesPromo) {
        codesData = response.codesPromo;
      } else if (Array.isArray(response)) {
        codesData = response;
      }
      
      console.log('🎯 Codes extraits:', codesData);
      console.log('📊 Nombre de codes:', codesData.length);
      
      setCodes(codesData);
    } catch (error) {
      console.error('❌ Erreur chargement codes:', error);
      toast.error('Erreur lors du chargement des codes promo');
    }
  };

  const loadRooms = async () => {
    try {
      const response = await roomsService.getAllRooms();
      const roomsData = response.data.chambres || [];
      console.log('🏨 Chambres chargées:', roomsData.length);
      setRooms(roomsData);
    } catch (error) {
      console.error('❌ Erreur chargement chambres:', error);
      toast.error('Erreur lors du chargement des chambres');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        code: formData.code,
        description: formData.description,
        type: formData.type,
        value: formData.value,
        applicableToAll: formData.applicableToAll,
        chambres: formData.applicableToAll ? [] : formData.chambres,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        utilisationMax: formData.utilisationMax,
        minimumStay: formData.minimumStay,
        statut: formData.statut
      };

      console.log('🎯 Sauvegarde code promo:', submissionData);

      if (editingCode) {
        await updateCodePromo(editingCode._id, submissionData);
        toast.success('Code promo mis à jour avec succès');
      } else {
        await createCodePromo(submissionData);
        toast.success('Code promo créé avec succès');
      }
      
      setShowForm(false);
      setEditingCode(null);
      resetForm();
      await loadCodes();
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (codeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) {
      try {
        await deleteCodePromo(codeId);
        toast.success('Code promo supprimé avec succès');
        await loadCodes();
      } catch (error) {
        console.error('❌ Erreur suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      applicableToAll: true,
      chambres: [],
      dateDebut: '',
      dateFin: '',
      utilisationMax: 100,
      minimumStay: 1,
      statut: 'actif'
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papier');
  };

  const getStatus = (code) => {
    const now = new Date();
    if (code.statut !== 'actif') return 'inactif';
    if (new Date(code.dateFin) < now) return 'expire';
    if (code.utilisationActuelle >= code.utilisationMax) return 'epuise';
    return 'actif';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactif': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expire': return 'bg-red-100 text-red-800 border-red-200';
      case 'epuise': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCodes = codes.filter(code => {
    if (filter === 'all') return true;
    if (filter === 'active') return getStatus(code) === 'actif';
    if (filter === 'expired') return getStatus(code) === 'expire';
    if (filter === 'inactive') return getStatus(code) === 'inactif';
    return true;
  });

  const handleEdit = (code) => {
    console.log('✏️ Édition du code:', code);
    console.log('🏨 Chambres du code:', code.chambres);
    
    setEditingCode(code);
    
    // Extraire seulement les IDs des chambres
    const chambresIds = code.chambres?.map(chambre => 
      typeof chambre === 'object' ? chambre._id : chambre
    ) || [];
    
    console.log('🎯 IDs des chambres extraits:', chambresIds);
    
    setFormData({
      code: code.code,
      description: code.description,
      type: code.type,
      value: code.value,
      applicableToAll: code.applicableToAll,
      chambres: chambresIds,
      dateDebut: formatDateForInput(code.dateDebut),
      dateFin: formatDateForInput(code.dateFin),
      utilisationMax: code.utilisationMax,
      minimumStay: code.minimumStay,
      statut: code.statut
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Codes Promotionnels</h1>
          <p className="text-gray-600">Gérez les réductions et promotions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Code</span>
        </button>
      </div>

      {/* Boutons de debug */}
      <div className="flex space-x-4">
        <button
          onClick={loadCodes}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 text-sm"
        >
          <span>🔍 Recharger manuellement</span>
        </button>
        <button
          onClick={() => console.log('State actuel:', { codes, filteredCodes, rooms })}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 text-sm"
        >
          <span>📊 Debug State</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrer :</span>
          {['all', 'active', 'expired', 'inactive'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === filterType
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' && 'Tous'}
              {filterType === 'active' && 'Actifs'}
              {filterType === 'expired' && 'Expirés'}
              {filterType === 'inactive' && 'Inactifs'}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire de création/édition */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            {editingCode ? 'Modifier le Code Promo' : 'Nouveau Code Promo'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Code Promo *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="EXEMPLE20"
                />
                <p className="text-xs text-gray-500 mt-1">En majuscules, sans espaces</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Type de réduction *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (FCFA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Valeur */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valeur * {formData.type === 'percentage' ? '(0-100%)' : '(FCFA)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.type === 'percentage' ? 100 : 1000000}
                  step={formData.type === 'percentage' ? 1 : 100}
                  value={formData.value || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setFormData({...formData, value: isNaN(value) ? 0 : value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Utilisation max */}
              <div>
                <label className="block text-sm font-medium mb-2">Utilisations maximum *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.utilisationMax || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                    setFormData({...formData, utilisationMax: isNaN(value) ? 1 : value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Nombre maximum d'utilisations</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description visible par les clients..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dates */}
              <div>
                <label className="block text-sm font-medium mb-2">Date de début *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de fin *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dateFin}
                  onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Séjour minimum */}
              <div>
                <label className="block text-sm font-medium mb-2">Séjour minimum (nuits)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.minimumStay || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                    setFormData({...formData, minimumStay: isNaN(value) ? 1 : value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Nombre minimum de nuits pour appliquer le code</p>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>

            {/* Application aux chambres */}
            <div className="border-t pt-6">
              <label className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.applicableToAll}
                  onChange={(e) => setFormData({...formData, applicableToAll: e.target.checked, chambres: []})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Applicable à toutes les chambres</span>
              </label>

              {!formData.applicableToAll && (
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center">
                    <Home className="w-4 h-4 mr-2 text-blue-600" />
                    Chambres spécifiques *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg">
                    {rooms.map((room) => (
                      <label key={room._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={formData.chambres.includes(room._id)}
                          onChange={(e) => {
                            const newChambres = e.target.checked
                              ? [...formData.chambres, room._id]
                              : formData.chambres.filter(id => id !== room._id);
                            setFormData({...formData, chambres: newChambres});
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {room.name} (#{room.number})
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.chambres.length} chambre(s) sélectionnée(s)
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>{editingCode ? 'Modifier le Code' : 'Créer le Code'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCode(null);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des codes promo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réduction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((code) => {
                  const status = getStatus(code);
                  return (
                    <tr key={code._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-600">{code.code}</span>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copier le code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">{code.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {code.type === 'percentage' ? `${code.value}%` : `${code.value} FCFA`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {code.applicableToAll ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              Toutes chambres
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {code.chambres?.length || 0} chambre(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 space-y-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(code.dateDebut).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(code.dateFin).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {code.utilisationActuelle || 0} / {code.utilisationMax}
                        </div>
                        {code.minimumStay > 1 && (
                          <div className="text-xs text-gray-500">
                            Séjour min: {code.minimumStay} nuit(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
                          {status === 'actif' && 'Actif'}
                          {status === 'inactif' && 'Inactif'}
                          {status === 'expire' && 'Expiré'}
                          {status === 'epuise' && 'Épuisé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(code)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(code._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500 text-lg">
                      {filter === 'all' ? 'Aucun code promo créé' : `Aucun code promo ${filter}`}
                    </div>
                    {filter !== 'all' && (
                      <button
                        onClick={() => setFilter('all')}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Voir tous les codes
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromoCodes;