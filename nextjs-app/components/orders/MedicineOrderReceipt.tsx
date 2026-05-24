import React from 'react';
import { MedicineOrder } from '@/types/medicineOrder';

export default function MedicineOrderReceipt({ order }: { order: MedicineOrder }) {
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div className="hidden print:block" style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#111', padding: '32px', maxWidth: '680px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d9488', paddingBottom: '12px', marginBottom: '20px' }}>
                <div>
                    <p style={{ fontSize: '22px', fontWeight: 900, color: '#0d9488', margin: 0 }}>AyroPath</p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>Health Diagnostics Platform</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Order Receipt</p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '3px 0 0' }}>Order ID: <strong style={{ color: '#111', fontFamily: 'monospace' }}>{order.orderId}</strong></p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>Date: {dateStr}</p>
                </div>
            </div>

            {/* Delivery Address */}
            {order.shippingAddress && (
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '6px' }}>Delivery Address</p>
                    <p style={{ fontWeight: 700, margin: '0 0 2px' }}>{order.shippingAddress.fullName}</p>
                    <p style={{ margin: '0 0 2px', color: '#374151' }}>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p style={{ margin: '0 0 2px', color: '#374151' }}>{order.shippingAddress.addressLine2}</p>}
                    <p style={{ margin: '0 0 2px', color: '#374151' }}>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
                    <p style={{ margin: 0, color: '#374151' }}>Mobile: {order.shippingAddress.mobile}</p>
                </div>
            )}

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px' }}>
                                <p style={{ fontWeight: 600, margin: '0 0 2px' }}>{item.name}</p>
                                {item.packSize && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{item.packSize}</p>}
                            </td>
                            <td style={{ textAlign: 'center', padding: '8px 10px', color: '#374151' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '8px 10px', color: '#374151' }}>₹{item.offerPrice.toFixed(0)}</td>
                            <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600 }}>₹{(item.offerPrice * item.quantity).toFixed(0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pricing Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ width: '240px' }}>
                    {[
                        { label: 'Subtotal', value: `₹${order.subtotal.toFixed(0)}` },
                        { label: 'Delivery Charge', value: order.deliveryCharge === 0 ? 'Free' : `₹${order.deliveryCharge.toFixed(0)}` },
                        ...(order.totalDiscount > 0 ? [{ label: 'Discount', value: `-₹${order.totalDiscount.toFixed(0)}` }] : []),
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#6b7280', fontSize: '12px' }}>
                            <span>{label}</span>
                            <span>{value}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0d9488', marginTop: '6px', fontWeight: 800, fontSize: '14px' }}>
                        <span>Grand Total</span>
                        <span style={{ color: '#0d9488' }}>₹{order.grandTotal.toFixed(0)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Info */}
            <div style={{ padding: '10px 14px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                    Payment via <strong style={{ color: '#111' }}>Cashfree</strong> &nbsp;·&nbsp; Status: <strong style={{ color: order.payment.status === 'paid' ? '#16a34a' : '#374151', textTransform: 'capitalize' }}>{order.payment.status}</strong>
                    {order.payment.paidAt && (
                        <span style={{ color: '#9ca3af' }}> on {new Date(order.payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                </p>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '16px', color: '#9ca3af', fontSize: '11px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#6b7280' }}>Thank you for choosing AyroPath!</p>
                <p style={{ margin: 0 }}>For support: support@ayropath.com</p>
            </div>
        </div>
    );
}
