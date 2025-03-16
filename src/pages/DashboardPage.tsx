import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  BarChart, 
  PieChart, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Search,
  Lock
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Event, Role } from '../types';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Dashboard metrics calculation functions
const calculateMetrics = (events: Event[]) => {
  const totalEvents = events.length;
  const totalRoles = events.reduce((sum, event) => sum + event.roles.length, 0);
  
  const totalVolunteers = events.reduce((sum, event) => 
    sum + event.roles.reduce((roleSum, role) => 
      roleSum + role.volunteers.length, 0
    ), 0
  );
  
  const totalMinCapacity = events.reduce((sum, event) => 
    sum + event.roles.reduce((roleSum, role) => 
      roleSum + role.capacity, 0
    ), 0
  );
  
  const totalMaxCapacity = events.reduce((sum, event) => 
    sum + event.roles.reduce((roleSum, role) => 
      roleSum + (role.maxCapacity || role.capacity), 0
    ), 0
  );
  
  const fillRate = totalMinCapacity > 0 
    ? Math.round((totalVolunteers / totalMinCapacity) * 100) 
    : 0;
  
  const maxFillRate = totalMaxCapacity > 0 
    ? Math.round((totalVolunteers / totalMaxCapacity) * 100) 
    : 0;
  
  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date()).length;
  const pastEvents = totalEvents - upcomingEvents;
  
  const fullyStaffedRoles = events.reduce((sum, event) => 
    sum + event.roles.filter(role => 
      role.volunteers.length >= role.capacity
    ).length, 0
  );
  
  const rolesFillRate = totalRoles > 0 
    ? Math.round((fullyStaffedRoles / totalRoles) * 100) 
    : 0;
  
  return {
    totalEvents,
    totalRoles,
    totalVolunteers,
    totalMinCapacity,
    totalMaxCapacity,
    fillRate,
    maxFillRate,
    upcomingEvents,
    pastEvents,
    fullyStaffedRoles,
    rolesFillRate
  };
};

// Calculate metrics for a specific event
const calculateEventMetrics = (event: Event) => {
  const totalRoles = event.roles.length;
  
  const totalVolunteers = event.roles.reduce((sum, role) => 
    sum + role.volunteers.length, 0
  );
  
  const totalMinCapacity = event.roles.reduce((sum, role) => 
    sum + role.capacity, 0
  );
  
  const totalMaxCapacity = event.roles.reduce((sum, role) => 
    sum + (role.maxCapacity || role.capacity), 0
  );
  
  const fillRate = totalMinCapacity > 0 
    ? Math.round((totalVolunteers / totalMinCapacity) * 100) 
    : 0;
  
  const maxFillRate = totalMaxCapacity > 0 
    ? Math.round((totalVolunteers / totalMaxCapacity) * 100) 
    : 0;
  
  const fullyStaffedRoles = event.roles.filter(role => 
    role.volunteers.length >= role.capacity
  ).length;
  
  const rolesFillRate = totalRoles > 0 
    ? Math.round((fullyStaffedRoles / totalRoles) * 100) 
    : 0;
  
  const isPastEvent = new Date(event.date) < new Date();
  
  return {
    totalRoles,
    totalVolunteers,
    totalMinCapacity,
    totalMaxCapacity,
    fillRate,
    maxFillRate,
    fullyStaffedRoles,
    rolesFillRate,
    isPastEvent
  };
};

// Component for the metric card
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend,
  color = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700',
    secondary: 'bg-secondary-50 text-secondary-700',
    accent: 'bg-accent-50 text-accent-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };
  
  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
              )}
              <span>{Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${selectedColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Progress bar component
interface ProgressBarProps {
  value: number;
  maxValue?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  maxValue = 100, 
  color = 'primary',
  size = 'md',
  showLabel = true
}) => {
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    accent: 'bg-accent-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };
  
  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;
  const selectedSize = sizeClasses[size];
  
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`${selectedColor} ${selectedSize} rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs mt-1">
          <span>{value} / {maxValue}</span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
};

// Event card component for the dashboard
interface EventCardProps {
  event: Event;
  onToggleDetails: () => void;
  showDetails: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onToggleDetails, showDetails }) => {
  const metrics = calculateEventMetrics(event);
  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleDetails}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-2 h-12 rounded-full mr-3 ${isPastEvent ? 'bg-gray-400' : 'bg-primary-500'}`}></div>
            <div>
              <h3 className="font-semibold text-lg">{event.name}</h3>
              <p className="text-sm text-gray-600">{formatDate(event.date)} • {event.location}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-4">
              <div className="text-sm font-medium">
                {metrics.totalVolunteers} / {metrics.totalMinCapacity} volunteers
              </div>
              <div className="text-xs text-gray-500">
                {metrics.fillRate}% filled
              </div>
            </div>
            {showDetails ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500 mb-1">Roles</div>
              <div className="font-semibold">{metrics.totalRoles}</div>
              <div className="text-xs text-gray-500">
                {metrics.fullyStaffedRoles} fully staffed ({metrics.rolesFillRate}%)
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500 mb-1">Volunteers</div>
              <div className="font-semibold">{metrics.totalVolunteers}</div>
              <div className="text-xs text-gray-500">
                {metrics.fillRate}% of minimum capacity
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500 mb-1">Capacity Range</div>
              <div className="font-semibold">
                {metrics.totalMinCapacity} - {metrics.totalMaxCapacity}
              </div>
              <div className="text-xs text-gray-500">
                {metrics.maxFillRate}% of maximum capacity
              </div>
            </div>
          </div>
          
          <h4 className="font-medium text-sm mb-2">Roles Breakdown</h4>
          <div className="space-y-3">
            {event.roles.map(role => {
              const filledSpots = role.volunteers.length;
              const minCapacity = role.capacity;
              const maxCapacity = role.maxCapacity || role.capacity;
              const fillPercentage = Math.round((filledSpots / minCapacity) * 100);
              
              let statusColor = 'warning';
              if (fillPercentage >= 100) {
                statusColor = 'success';
              } else if (fillPercentage < 50) {
                statusColor = 'danger';
              }
              
              return (
                <div key={role.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm">
                      {filledSpots} / {minCapacity}
                      {maxCapacity > minCapacity && ` (max ${maxCapacity})`}
                    </div>
                  </div>
                  <ProgressBar 
                    value={filledSpots} 
                    maxValue={minCapacity} 
                    color={statusColor}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Link
              to={`/events/${event.id}`}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              View Event Details →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const DashboardPage: React.FC = () => {
  const { events } = useAppContext();
  const { isAuthenticated, isManager, clearMessages } = useAuth();
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Clear any authentication messages when component mounts
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);
  
  // If user is not authenticated or not a manager, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isManager) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="mb-6 text-gray-600">
            The dashboard is only accessible to managers and owners. You don't have the required permissions.
          </p>
          <Link
            to="/"
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors inline-block"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Filter events based on time filter and search term
  const filteredEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      const isPastEvent = eventDate < new Date();
      
      if (timeFilter === 'upcoming' && isPastEvent) return false;
      if (timeFilter === 'past' && !isPastEvent) return false;
      
      if (searchTerm.trim() === '') return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        event.name.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate overall metrics
  const metrics = calculateMetrics(events);
  
  // Calculate metrics for filtered events
  const filteredMetrics = calculateMetrics(filteredEvents);
  
  // Toggle event details
  const toggleEventDetails = (eventId: string) => {
    setExpandedEventIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };
  
  // Calculate role distribution data
  const roleDistribution = events.reduce((acc, event) => {
    event.roles.forEach(role => {
      const filled = role.volunteers.length;
      const minCapacity = role.capacity;
      
      if (filled >= minCapacity) {
        acc.filled++;
      } else if (filled >= minCapacity / 2) {
        acc.partiallyFilled++;
      } else {
        acc.understaffed++;
      }
    });
    return acc;
  }, { filled: 0, partiallyFilled: 0, understaffed: 0 });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <BarChart className="mr-2 h-8 w-8 text-primary-600" />
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of all events and volunteer statistics
        </p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Events"
          value={metrics.totalEvents}
          icon={<Calendar className="h-6 w-6" />}
          description={`${metrics.upcomingEvents} upcoming, ${metrics.pastEvents} past`}
          color="primary"
        />
        
        <MetricCard
          title="Total Volunteers"
          value={metrics.totalVolunteers}
          icon={<Users className="h-6 w-6" />}
          description={`Across ${metrics.totalRoles} roles`}
          color="secondary"
        />
        
        <MetricCard
          title="Fill Rate"
          value={`${metrics.fillRate}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          description={`${metrics.totalVolunteers}/${metrics.totalMinCapacity} positions filled`}
          color={metrics.fillRate >= 90 ? "success" : metrics.fillRate >= 70 ? "accent" : "warning"}
        />
        
        <MetricCard
          title="Staffed Roles"
          value={`${metrics.rolesFillRate}%`}
          icon={<Users className="h-6 w-6" />}
          description={`${metrics.fullyStaffedRoles}/${metrics.totalRoles} roles fully staffed`}
          color={metrics.rolesFillRate >= 90 ? "success" : metrics.rolesFillRate >= 70 ? "accent" : "warning"}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Volunteer Fill Rate</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Minimum Capacity</span>
                  <span className="text-sm font-medium">{metrics.fillRate}%</span>
                </div>
                <ProgressBar 
                  value={metrics.totalVolunteers} 
                  maxValue={metrics.totalMinCapacity} 
                  color={metrics.fillRate >= 90 ? "success" : metrics.fillRate >= 70 ? "accent" : "warning"}
                  size="lg"
                  showLabel={false}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span>0</span>
                  <span>{metrics.totalMinCapacity}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Maximum Capacity</span>
                  <span className="text-sm font-medium">{metrics.maxFillRate}%</span>
                </div>
                <ProgressBar 
                  value={metrics.totalVolunteers} 
                  maxValue={metrics.totalMaxCapacity} 
                  color="secondary"
                  size="lg"
                  showLabel={false}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span>0</span>
                  <span>{metrics.totalMaxCapacity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Role Status Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="inline-block w-24 h-24 rounded-full bg-green-100 border-8 border-green-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-green-700">{roleDistribution.filled}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">Fully Staffed</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-block w-24 h-24 rounded-full bg-yellow-100 border-8 border-yellow-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-yellow-700">{roleDistribution.partiallyFilled}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">Partially Filled</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-block w-24 h-24 rounded-full bg-red-100 border-8 border-red-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-red-700">{roleDistribution.understaffed}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">Understaffed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Events List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-xl font-semibold">Events Overview</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
                />
              </div>
              
              <div className="flex items-center bg-gray-100 rounded-md">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                    timeFilter === 'all' 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTimeFilter('upcoming')}
                  className={`px-3 py-2 text-sm font-medium ${
                    timeFilter === 'upcoming' 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setTimeFilter('past')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                    timeFilter === 'past' 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Past
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {filteredEvents.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredEvents.length} {timeFilter !== 'all' ? timeFilter : ''} events
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">{filteredMetrics.totalVolunteers}</span> volunteers / 
                  <span className="font-medium"> {filteredMetrics.fillRate}%</span> fill rate
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    showDetails={expandedEventIds.has(event.id)}
                    onToggleDetails={() => toggleEventDetails(event.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No events match your search "${searchTerm}"`
                  : `No ${timeFilter} events available`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;