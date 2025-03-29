import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import axios from 'axios';
import { debug } from '../utils/debug';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Define debug options
const DEBUG_OPTIONS = { component: 'Dashboard', timestamp: true };

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
  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      debug.logApiCall('/api/dashboard/stats', 'GET', {}, DEBUG_OPTIONS);
      const response = await api.get('/api/dashboard/stats');
      debug.info('Dashboard stats fetched successfully', DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: isLoadingOrders } = useQuery<RecentOrder[]>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      debug.logApiCall('/api/orders/recent', 'GET', {}, DEBUG_OPTIONS);
      const response = await api.get('/api/orders/recent');
      debug.info('Recent orders fetched successfully', DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
    refetchInterval: 30000, // Refresh every 30 seconds
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
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <ul className="mt-4 divide-y divide-gray-200">
              {recentOrders?.map((order) => (
                <li key={order.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.details}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 