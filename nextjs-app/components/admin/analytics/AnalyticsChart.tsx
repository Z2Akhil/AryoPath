'use client';

import React, { useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface AnalyticsChartProps {
    type?: 'line' | 'bar' | 'pie' | 'area';
    data?: any[];
    xKey?: string;
    yKeys?: string[];
    colors?: string[];
    title?: string;
    loading?: boolean;
    height?: number;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
    type = 'line',
    data = [],
    xKey = 'date',
    yKeys = [],
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    title,
    loading = false,
    height = 400
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey={xKey}
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                fontSize: '12px',
                                padding: '12px'
                            }}
                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        {yKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={{ r: 4, fill: colors[index % colors.length], strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1500}
                            />
                        ))}
                    </LineChart>
                );

            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey={xKey}
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                fontSize: '12px',
                                padding: '12px'
                            }}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        {yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={colors[index % colors.length]}
                                radius={[6, 6, 0, 0]}
                                barSize={32}
                                animationDuration={1500}
                            />
                        ))}
                    </BarChart>
                );

            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={(_, index) => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    style={{
                                        filter: hoveredIndex === index ? 'brightness(1.1)' : 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => [value, 'Count']}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                fontSize: '12px',
                                padding: '12px'
                            }}
                        />
                        <Legend iconType="circle" />
                    </PieChart>
                );

            case 'area':
                return (
                    <AreaChart data={data}>
                        <defs>
                            {yKeys.map((key, index) => (
                                <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey={xKey}
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                fontSize: '12px',
                                padding: '12px'
                            }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        {yKeys.map((key, index) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                fillOpacity={1}
                                fill={`url(#gradient-${key})`}
                                strokeWidth={3}
                                animationDuration={1500}
                            />
                        ))}
                    </AreaChart>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-w-0">
            {title && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>
            )}
            <div style={{ height: `${height}px`, width: '100%' }} className="relative">
                {/* Loading skeleton — outside ResponsiveContainer so height is correct */}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse w-full px-4">
                            <div className="h-full bg-gray-100 rounded-xl w-full" style={{ height: `${height - 32}px` }}></div>
                        </div>
                    </div>
                ) : (!data || data.length === 0) ? (
                    /* Empty state — centered in the plot area */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="32" width="6" height="12" rx="2" fill="currentColor" opacity="0.2" />
                            <rect x="14" y="20" width="6" height="24" rx="2" fill="currentColor" opacity="0.2" />
                            <rect x="24" y="26" width="6" height="18" rx="2" fill="currentColor" opacity="0.2" />
                            <rect x="34" y="14" width="6" height="30" rx="2" fill="currentColor" opacity="0.2" />
                            <line x1="4" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                        </svg>
                        <p className="text-sm font-medium">No data for this period</p>
                        <p className="text-xs text-gray-300">Try selecting a wider date range</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        {renderChart()}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default AnalyticsChart;
