import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  cancelled_orders: number;
}

interface RecentOrder {
  id: string;
  table_id: number;
  seat_number: number;
  details: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export const Dashboard: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    },
  });

  // Fetch recent orders
  const { data: recentOrders } = useQuery<RecentOrder[]>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await axios.get('/api/orders/recent');
      return response.data;
    },
  });

  const statCards = [
    {
      name: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Confirmed Orders',
      value: stats?.confirmed_orders || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Cancelled Orders',
      value: stats?.cancelled_orders || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={`absolute rounded-md ${card.color} p-3`}>
                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {card.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Recent Orders
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {recentOrders?.map((order) => (
              <li key={order.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClipboardDocumentListIcon
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Table {order.table_id} - Seat {order.seat_number}
                      </p>
                      <p className="text-sm text-gray-500">{order.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 