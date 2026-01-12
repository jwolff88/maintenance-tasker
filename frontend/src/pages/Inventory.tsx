import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../services/api';
import {
  Package, Plus, Search, AlertTriangle, ArrowDownCircle,
  ArrowUpCircle, Edit2, Trash2, X
} from 'lucide-react';

const categories = [
  'PLUMBING', 'ELECTRICAL', 'HVAC', 'HARDWARE', 'PAINT',
  'FLOORING', 'APPLIANCE_PARTS', 'SAFETY', 'CLEANING', 'OTHER'
];

export default function Inventory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'OTHER',
    quantity: 0,
    minQuantity: 5,
    unit: 'each',
    unitCost: '',
    storageLocation: '',
    supplierName: ''
  });
  const [transactionData, setTransactionData] = useState({
    type: 'RESTOCK',
    quantity: 1,
    notes: ''
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory', search, categoryFilter, showLowStock],
    queryFn: () => inventoryApi.getAll({
      ...(search && { search }),
      ...(categoryFilter && { category: categoryFilter }),
      ...(showLowStock && { lowStock: 'true' })
    }).then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryApi.getStats().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowModal(false);
      setEditItem(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
  });

  const transactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryApi.addTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setShowTransactionModal(null);
      setTransactionData({ type: 'RESTOCK', quantity: 1, notes: '' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: 'OTHER',
      quantity: 0,
      minQuantity: 5,
      unit: 'each',
      unitCost: '',
      storageLocation: '',
      supplierName: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      unitCost: item.unitCost?.toString() || '',
      storageLocation: item.storageLocation || '',
      supplierName: item.supplierName || ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600">Manage maintenance supplies and parts</p>
        </div>
        <button onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-bold">{stats.totalUnits}</p>
          </div>
          <div className={`card ${stats.lowStockCount > 0 ? 'bg-red-50' : ''}`}>
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : ''}`}>
              {stats.lowStockCount}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <p className="text-2xl font-bold">${stats.inventoryValue?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded"
          />
          <span className="text-sm text-gray-700">Low Stock Only</span>
        </label>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : items?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <div key={item.id} className={`card ${item.isLowStock ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                </div>
                <span className="badge badge-gray text-xs">{item.category.replace(/_/g, ' ')}</span>
              </div>

              <div className="flex items-center justify-between my-3">
                <div>
                  <p className="text-3xl font-bold">{item.quantity}</p>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                </div>
                {item.isLowStock && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Low Stock</span>
                  </div>
                )}
              </div>

              {item.unitCost && (
                <p className="text-sm text-gray-500 mb-3">
                  ${Number(item.unitCost).toFixed(2)} per {item.unit}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTransactionModal(item.id)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm py-1.5"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Adjust
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this item?')) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">Add your first inventory item.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Item
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{editItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
                <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  {!editItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        className="input"
                        min="0"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity (Alert)</label>
                    <input
                      type="number"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                      className="input"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input"
                      placeholder="each, box, roll..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                    <input
                      type="text"
                      value={formData.storageLocation}
                      onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                      className="input"
                      placeholder="Warehouse A, Shelf 3"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex-1">
                    {editItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Adjust Stock</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                transactionMutation.mutate({
                  id: showTransactionModal,
                  data: transactionData
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={transactionData.type}
                    onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value })}
                    className="input"
                  >
                    <option value="RESTOCK">Restock (Add)</option>
                    <option value="USED">Used (Remove)</option>
                    <option value="DAMAGED">Damaged (Remove)</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="RETURNED">Returned (Add)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({ ...transactionData, quantity: parseInt(e.target.value) || 1 })}
                    className="input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={transactionData.notes}
                    onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                    className="input"
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowTransactionModal(null)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={transactionMutation.isPending} className="btn-primary flex-1">
                    {transactionMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
