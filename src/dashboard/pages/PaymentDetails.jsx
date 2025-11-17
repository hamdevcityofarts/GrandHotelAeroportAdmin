import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Mail,
  Undo2,
  Flag
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import paymentService from '../../services/paymentService';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Formatage montant FCFA
  const formatAmountCFA = (amount) => {
    return `${parseFloat(amount).toLocaleString('fr-FR')} FCFA`;
  };

  // Charger les détails du paiement
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Chargement des détails du paiement:', id);
        
        // Utiliser le service de paiement pour récupérer les détails
        const response = await paymentService.getPaymentById(id);
        
        if (response.data && response.data.payment) {
          setPayment(response.data.payment);
          console.log('✅ Détails du paiement chargés:', response.data.payment);
        } else {
          throw new Error('Paiement non trouvé');
        }
      } catch (err) {
        console.error('❌ Erreur chargement paiement:', err);
        setError(err.response?.data?.message || err.message || 'Paiement non trouvé');
        toast.error('Erreur lors du chargement des détails du paiement');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id, toast]);

  const handleRefund = async () => {
    if (!payment || !window.confirm('Confirmer le remboursement ?')) return;
    
    try {
      setProcessing(true);
      await paymentService.refundPayment(id);
      toast.success('Remboursement effectué avec succès');
      
      // Recharger les données
      const response = await paymentService.getPaymentById(id);
      if (response.data && response.data.payment) {
        setPayment(response.data.payment);
      }
    } catch (err) {
      console.error('❌ Erreur remboursement:', err);
      toast.error(err.response?.data?.message || err.message || 'Erreur lors du remboursement');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!payment) return;
    
    try {
      setProcessing(true);
      const blob = await paymentService.downloadReceipt(id);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reçu-${payment.transactionId || payment._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Reçu téléchargé avec succès');
    } catch (err) {
      console.error('❌ Erreur téléchargement reçu:', err);
      toast.error(err.response?.data?.message || err.message || 'Erreur lors du téléchargement');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReceipt = async () => {
    if (!payment) return;
    
    try {
      setProcessing(true);
      await paymentService.sendReceipt(id);
      toast.success('Reçu envoyé par email avec succès');
    } catch (err) {
      console.error('❌ Erreur envoi reçu:', err);
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de l\'envoi du reçu');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'refunded': return <Undo2 className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Complet';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      case 'refunded': return 'Remboursé';
      case 'partially_refunded': return 'Partiellement remboursé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Paiement non trouvé</h2>
        <p className="text-red-600 mb-4">{error || 'Le paiement demandé n\'existe pas'}</p>
        <button 
          onClick={() => navigate('/dashboard/payments')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour aux paiements
        </button>
      </div>
    );
  }

  // Construction du détail du montant
  const breakdown = [
    { 
      item: `${payment.reservation?.nights || 1} nuits - ${payment.reservation?.chambre?.name || 'Chambre'}`,
      amount: payment.amount 
    }
  ];

  // Ajouter les taxes si disponibles
  if (payment.taxAmount && payment.taxAmount > 0) {
    breakdown.push({ 
      item: 'Taxes et frais', 
      amount: payment.taxAmount 
    });
  }

  // Pour les acomptes, montrer le solde restant
  if (payment.type === 'deposit' && payment.reservation?.totalAmount) {
    const remainingAmount = payment.reservation.totalAmount - payment.amount;
    if (remainingAmount > 0) {
      breakdown.push({ 
        item: 'Solde à payer', 
        amount: -remainingAmount 
      });
    }
  }

  const totalAmount = breakdown.reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/dashboard/payments')} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Paiement #{payment.transactionId || payment._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600">
              {payment.type === 'deposit' ? 'Acompte' : 'Paiement complet'} • 
              Créé le {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDownloadReceipt}
            disabled={processing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{processing ? 'Téléchargement...' : 'Télécharger'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Détails du paiement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Détails du Paiement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="font-medium text-lg">
                  {payment.client?.name} {payment.client?.surname}
                </p>
                {payment.client?.email && (
                  <p className="text-sm text-gray-600 mt-1">{payment.client.email}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Montant</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmountCFA(payment.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-medium">
                  {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Méthode</p>
                <p className="font-medium capitalize">
                  {payment.method || 'Carte bancaire'} 
                  {payment.cardLast4 ? ` •••• ${payment.cardLast4}` : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Réservation</p>
                <p className="font-medium">
                  {payment.reservation?.chambre?.name || 'Chambre'} - {payment.reservation?.nights || 1} nuit(s)
                </p>
                {payment.reservation?.checkIn && (
                  <p className="text-sm text-gray-600 mt-1">
                    Du {new Date(payment.reservation.checkIn).toLocaleDateString('fr-FR')} 
                    au {new Date(payment.reservation.checkOut).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Statut</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(payment.status)}
                  <span className="font-medium capitalize text-lg">
                    {getStatusText(payment.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Détail du montant */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Détail du Montant</h2>
            <div className="space-y-3">
              {breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className={item.amount < 0 ? 'text-red-600' : 'text-gray-700'}>
                    {item.item}
                  </span>
                  <span className={item.amount < 0 ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>
                    {item.amount > 0 ? '' : '-'}{formatAmountCFA(Math.abs(item.amount))}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                <span>Total {payment.type === 'deposit' ? 'acompte' : 'payé'}</span>
                <span className="text-green-600">{formatAmountCFA(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleSendReceipt}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Envoyer un reçu</span>
              </button>
              
              {payment.status === 'completed' && payment.type !== 'deposit' && (
                <button 
                  onClick={handleRefund}
                  disabled={processing}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Traiter un remboursement</span>
                </button>
              )}
              
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 transition-colors">
                <Flag className="w-4 h-4" />
                <span>Marquer comme contesté</span>
              </button>
            </div>
          </div>

          {/* Informations techniques */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Informations Techniques</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID Transaction</span>
                <span className="font-mono text-gray-900">
                  {payment.transactionId || payment._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Processeur</span>
                <span className="capitalize text-gray-900">{payment.gateway || 'CyberSource'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize text-gray-900">
                  {payment.type === 'deposit' ? 'Acompte' : 'Complet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Devise</span>
                <span className="text-gray-900">FCFA (XAF)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière mise à jour</span>
                <span className="text-gray-900">
                  {new Date(payment.updatedAt).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;