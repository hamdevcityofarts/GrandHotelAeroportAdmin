import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Mail, Phone, Shield, User, Calendar } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import userService from '../../services/userService'
import { useAppSelector } from '../../hooks'

const EditUser = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Vérifier les permissions
  const canEditUser = () => {
    if (!user || !currentUser) return false
    // L'utilisateur peut s'éditer lui-même
    if (currentUser._id === user._id) return true
    // Seuls les admins peuvent éditer d'autres utilisateurs
    return currentUser.role === 'admin'
  }

  // Charger les données de l'utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        console.log('🔄 Chargement des détails utilisateur ID:', id)
        
        const response = await userService.getUserById(id)
        
        if (response.data) {
          setUser(response.data)
          console.log('✅ Utilisateur chargé:', response.data)
          
          // Vérifier les permissions après chargement
          if (!canEditUser()) {
            toast.error("Vous n'avez pas les permissions pour modifier cet utilisateur")
            navigate(`/dashboard/user/${id}`)
          }
        } else {
          throw new Error('Utilisateur non trouvé')
        }
      } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error)
        toast.error('Erreur lors du chargement des données utilisateur')
        navigate('/dashboard/users')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [id, toast, navigate, currentUser])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      console.log('💾 Sauvegarde des modifications utilisateur:', user)

      const response = await userService.updateUser(id, {
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.role,
        status: user.status,
        permissions: user.permissions
      })

      if (response.data) {
        toast.success('Utilisateur modifié avec succès')
        navigate(`/dashboard/user/${id}`)
        console.log('✅ Utilisateur sauvegardé:', response.data)
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde utilisateur:', error)
      toast.error('Erreur lors de la sauvegarde des modifications')
    } finally {
      setSaving(false)
    }
  }

  const handlePermissionToggle = (permissionId) => {
    const updatedPermissions = user.permissions.includes(permissionId)
      ? user.permissions.filter(p => p !== permissionId)
      : [...user.permissions, permissionId]
    
    setUser(prev => ({ ...prev, permissions: updatedPermissions }))
  }

  const allPermissions = [
    { id: 'gestion_utilisateurs', label: 'Gestion utilisateurs' },
    { id: 'gestion_chambres', label: 'Gestion chambres' },
    { id: 'gestion_reservations', label: 'Gestion réservations' },
    { id: 'gestion_clients', label: 'Gestion clients' },
    { id: 'acces_finances', label: 'Accès finances' },
    { id: 'rapports', label: 'Génération rapports' },
    { id: 'parametres_systeme', label: 'Paramètres système' },
    { id: 'gestion_menage', label: 'Gestion ménage' },
    { id: 'gestion_restaurant', label: 'Gestion restaurant' }
  ]

  const departments = [
    { value: 'direction', label: 'Direction' },
    { value: 'reception', label: 'Réception' },
    { value: 'housekeeping', label: 'Service de ménage' },
    { value: 'restaurant', label: 'Restauration' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Autre' }
  ]

  const roles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Gérant' },
    { value: 'receptionist', label: 'Réceptionniste' },
    { value: 'housekeeper', label: 'Agent de ménage' },
    { value: 'supervisor', label: 'Superviseur' },
    { value: 'technician', label: 'Technicien' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données utilisateur...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Utilisateur non trouvé</h2>
        <button 
          onClick={() => navigate('/dashboard/users')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Retour aux utilisateurs
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(`/dashboard/user/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifier {user.name} {user.surname}</h1>
            <p className="text-gray-600">
              Édition des informations utilisateur
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
          <button 
            onClick={() => navigate(`/dashboard/user/${id}`)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors"
          >
            <span>Annuler</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Informations Personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={user.name || ''}
                  onChange={(e) => setUser({...user, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={user.surname || ''}
                  onChange={(e) => setUser({...user, surname: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  onChange={(e) => setUser({...user, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={user.phone || ''}
                  onChange={(e) => setUser({...user, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-600" />
              Permissions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allPermissions.map(permission => (
                <label 
                  key={permission.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    user.permissions?.includes(permission.id)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  } hover:bg-gray-100`}
                >
                  <input
                    type="checkbox"
                    checked={user.permissions?.includes(permission.id) || false}
                    onChange={() => handlePermissionToggle(permission.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{permission.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Rôle et statut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-green-600" />
              Rôle et Statut
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Département
                </label>
                <select
                  value={user.department || ''}
                  onChange={(e) => setUser({...user, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un département</option>
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  value={user.role || ''}
                  onChange={(e) => setUser({...user, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  value={user.status || 'actif'}
                  onChange={(e) => setUser({...user, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="en_conge">En congé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informations de connexion */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-orange-600" />
              Informations de Connexion
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière connexion</span>
                <span className="font-medium">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Membre depuis</span>
                <span className="font-medium">
                  {user.memberSince ? new Date(user.memberSince).toLocaleDateString('fr-FR') : 'Non défini'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date de création</span>
                <span className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non défini'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUser