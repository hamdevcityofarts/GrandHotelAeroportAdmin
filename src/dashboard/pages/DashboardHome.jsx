import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Bed, Calendar, Users, DollarSign, Shield } from 'lucide-react'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import TableCard from '../components/TableCard'
import reservationService from '../../services/reservationService'
import { useAppSelector } from '../../hooks'
import {
  statsData,
  revenueData,
  occupancyData
} from '../data/mockData'

// ✅ NOUVEAU : Icône FCFA personnalisée
const CFAIcon = ({ className = "w-5 h-5" }) => (
  <div className={`${className} flex items-center justify-center font-bold text-green-600`}>
    <span className="text-xs">FCFA</span>
  </div>
);

// ✅ NOUVELLE FONCTION : Vérifier les permissions de l'utilisateur
const checkUserPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
};

const DashboardHome = () => {
  const [recentReservations, setRecentReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    occupancyRate: 0,
    totalBookings: 0,
    availableRooms: 0
  })
  
  // ✅ NOUVEAU : Récupérer l'utilisateur connecté et ses permissions
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const userPermissions = currentUser?.permissions || []
  const userRole = currentUser?.role || ''

  // ✅ FORMATAGE DIRECT EN FCFA
  const formatAmountCFA = (amount) => {
    return `${parseFloat(amount).toLocaleString('fr-FR')} FCFA`;
  };

  // Charger les dernières réservations
  const loadRecentReservations = async () => {
    try {
      setLoading(true)
      
      const response = await reservationService.getReservations({ 
        page: 1, 
        limit: 3,
        sort: 'createdAt:desc'
      })
      
      if (response.success) {
        const reservations = response.reservations || []
        setRecentReservations(reservations.slice(0, 3))
        
        const totalRevenue = reservations.reduce((sum, res) => sum + (res.totalAmount || 0), 0)
        const confirmedReservations = reservations.filter(res => res.status === 'confirmed').length
        
        setDashboardStats({
          totalRevenue,
          occupancyRate: Math.round((confirmedReservations / Math.max(reservations.length, 1)) * 100),
          totalBookings: reservations.length,
          availableRooms: 10 - confirmedReservations
        })
      }
    } catch (error) {
      console.error('❌ Erreur chargement réservations récentes:', error)
      setRecentReservations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // ✅ Vérifier si l'utilisateur a accès au dashboard
    if (currentUser) {
      // Admin a accès à tout
      if (userRole !== 'admin') {
        // Vérifier les permissions minimales
        const hasAnyPermission = [
          'gestion_reservations',
          'gestion_chambres', 
          'gestion_clients',
          'acces_finances',
          'rapports'
        ].some(permission => checkUserPermission(userPermissions, permission))
        
        if (!hasAnyPermission) {
          console.log('⚠️ Utilisateur sans permissions pour le dashboard')
          // Redirection vers une page d'accès limité ou message
        }
      }
      loadRecentReservations()
    }
  }, [currentUser])

  // ✅ SUPPRIMÉ : Conversion des données de revenus
  // ✅ UTILISER LES DONNÉES DIRECTEMENT EN FCFA
  const revenueDataCFA = revenueData.map(item => ({
    ...item,
    revenue: item.revenue // Déjà en FCFA
  }));

  // ✅ NOUVEAU : Statistiques avec vérification de permission
  const getFilteredStats = () => {
    const allStats = [
      {
        title: 'Revenu Total',
        value: formatAmountCFA(dashboardStats.totalRevenue),
        change: 12.5,
        icon: CFAIcon,
        color: 'green',
        requiredPermission: 'acces_finances', // ✅ Permission spécifique
        visibleToRoles: ['admin', 'manager', 'supervisor'] // ✅ Rôles spécifiques
      },
      {
        title: 'Taux Occupation',
        value: `${dashboardStats.occupancyRate}%`,
        change: 8.2,
        icon: Bed,
        color: 'blue',
        requiredPermission: 'gestion_chambres',
        visibleToRoles: ['admin', 'manager', 'receptionist', 'supervisor', 'technician']
      },
      {
        title: 'Réservations',
        value: dashboardStats.totalBookings,
        change: 15.3,
        icon: Calendar,
        color: 'orange',
        requiredPermission: 'gestion_reservations',
        visibleToRoles: ['admin', 'manager', 'receptionist', 'supervisor']
      },
      {
        title: 'Chambres Libres',
        value: dashboardStats.availableRooms,
        change: -5.2,
        icon: Users,
        color: 'purple',
        requiredPermission: 'gestion_chambres',
        visibleToRoles: ['admin', 'manager', 'receptionist', 'supervisor', 'technician']
      }
    ];

    // Filtrer selon le rôle et les permissions
    return allStats.filter(stat => {
      // Admin voit tout
      if (userRole === 'admin') return true;
      
      // Vérifier si le rôle a accès
      if (!stat.visibleToRoles.includes(userRole)) return false;
      
      // Vérifier la permission spécifique
      return checkUserPermission(userPermissions, stat.requiredPermission);
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmée'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulée'
      case 'completed': return 'Terminée'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  // ✅ Vérifier si l'utilisateur peut voir les graphiques
  const canSeeRevenueChart = userRole === 'admin' || 
    (['manager', 'supervisor'].includes(userRole) && 
     checkUserPermission(userPermissions, 'acces_finances'));
  
  const canSeeOccupancyChart = userRole === 'admin' || 
    (['manager', 'receptionist', 'supervisor', 'technician'].includes(userRole) && 
     checkUserPermission(userPermissions, 'gestion_chambres'));

  // ✅ Vérifier si l'utilisateur peut voir les réservations
  const canSeeReservations = userRole === 'admin' || 
    (['manager', 'receptionist', 'supervisor'].includes(userRole) && 
     checkUserPermission(userPermissions, 'gestion_reservations'));

  return (
    <div className="space-y-6">
      {/* ✅ Message d'accueil personnalisé */}
      <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {currentUser?.name || 'Utilisateur'} 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue sur votre tableau de bord {roles.find(r => r.value === userRole)?.label?.toLowerCase() || ''}
            </p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-lg border">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-gray-700">
              {getFilteredStats().length} indicateurs disponibles
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques FILTRÉES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {getFilteredStats().map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
        
        {/* ✅ Message si aucune statistique disponible */}
        {getFilteredStats().length === 0 && (
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Aucun indicateur disponible
            </h3>
            <p className="text-yellow-700">
              Votre rôle "{roles.find(r => r.value === userRole)?.label}" ne vous donne pas accès aux indicateurs du dashboard.
              Contactez un administrateur pour modifier vos permissions.
            </p>
          </div>
        )}
      </div>

      {/* Graphiques avec vérification de permission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des revenus - visible uniquement avec permission finances */}
        {canSeeRevenueChart ? (
          <ChartCard title="Revenus Mensuels (F CFA)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueDataCFA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Revenu']}
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  name="Revenu"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Accès restreint">
            <div className="h-300 flex flex-col items-center justify-center p-6">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Accès aux finances non autorisé
              </h3>
              <p className="text-gray-500 text-center">
                Vous n'avez pas la permission "Accès finances" pour visualiser les revenus.
              </p>
            </div>
          </ChartCard>
        )}

        {/* Graphique d'occupation */}
        {canSeeOccupancyChart ? (
          <ChartCard title="Taux d'Occupation Hebdomadaire">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Occupation']}
                />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  name="Taux d'occupation"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Accès restreint">
            <div className="h-300 flex flex-col items-center justify-center p-6">
              <Bed className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Accès aux chambres non autorisé
              </h3>
              <p className="text-gray-500 text-center">
                Vous n'avez pas la permission "Gestion chambres" pour visualiser l'occupation.
              </p>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Dernières Réservations - visible uniquement avec permission */}
      {canSeeReservations ? (
        <TableCard
          title="Dernières Réservations"
          headers={['Client', 'Chambre', 'Dates', 'Statut', 'Montant']}
          data={recentReservations}
          emptyMessage={
            loading 
              ? "Chargement des réservations..." 
              : "Aucune réservation récente"
          }
          renderRow={(reservation) => (
            <tr key={reservation._id} className="hover:bg-gray-50 border-b border-gray-200">
              {/* Client */}
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.client?.name} {reservation.client?.surname}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.client?.email}
                    </div>
                  </div>
                </div>
              </td>

              {/* Chambre */}
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-medium">
                  {reservation.chambre?.number}
                </div>
                <div className="text-sm text-gray-500">
                  {reservation.chambre?.name}
                </div>
              </td>

              {/* Dates */}
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(reservation.checkIn)}
                </div>
                <div className="text-sm text-gray-500">
                  au {formatDate(reservation.checkOut)}
                </div>
                <div className="text-xs text-gray-400">
                  {reservation.nights || reservation.nuits} nuit(s)
                </div>
              </td>

              {/* Statut */}
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                  {getStatusText(reservation.status)}
                </span>
              </td>

              {/* Montant - UNIQUEMENT EN FCFA */}
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatAmountCFA(reservation.totalAmount)}
                </div>
              </td>
            </tr>
          )}
        />
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Réservations non accessibles
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Votre rôle ne vous donne pas accès à la gestion des réservations.
            Vous pouvez contacter un administrateur si vous pensez en avoir besoin.
          </p>
        </div>
      )}

      {/* Bouton de rafraîchissement (visible seulement si certaines permissions) */}
      {(canSeeRevenueChart || canSeeOccupancyChart || canSeeReservations) && (
        <div className="flex justify-center">
          <button
            onClick={loadRecentReservations}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <span>{loading ? 'Chargement...' : 'Rafraîchir les données'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ✅ NOUVEAU : Tableau des rôles (identique à AddUser/EditUser)
const roles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Gérant' },
  { value: 'receptionist', label: 'Réceptionniste' },
  { value: 'housekeeper', label: 'Agent de ménage' },
  { value: 'supervisor', label: 'Superviseur' },
  { value: 'technician', label: 'Technicien' }
]

export default DashboardHome