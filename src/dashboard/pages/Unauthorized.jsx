// pages/Unauthorized.jsx
import React from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

const Unauthorized = () => {
  const { userRole, userPermissions } = usePermissions()
  
  const permissionsList = [
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

  const userHasPermissions = permissionsList.filter(p => 
    userPermissions.includes(p.id)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Accès refusé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">
              Votre statut actuel
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Rôle:</span>
                <span className="font-medium">{getRoleLabel(userRole)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Permissions actives:</span>
                <span className="font-medium">{userPermissions.length}</span>
              </div>
            </div>
          </div>
          
          {userHasPermissions.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">
                Vos permissions actuelles:
              </h4>
              <div className="space-y-1">
                {userHasPermissions.map(permission => (
                  <div key={permission.id} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>{permission.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retour à la page précédente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const getRoleLabel = (roleValue) => {
  const roles = {
    'admin': 'Administrateur',
    'manager': 'Gérant',
    'receptionist': 'Réceptionniste',
    'housekeeper': 'Agent de ménage',
    'supervisor': 'Superviseur',
    'technician': 'Technicien'
  }
  return roles[roleValue] || 'Utilisateur'
}

export default Unauthorized