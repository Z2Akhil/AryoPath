"use client";

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartValidation } from '@/hooks/useCartValidation';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import { useUser } from '@/providers/UserProvider';
import { useCart } from '@/providers/CartProvider';
import { useAuthModal } from '@/providers/AuthModalProvider';
import Link from 'next/link';

interface AddToCartWithValidationProps {
    productCode: string;
    productType: string;
    productName: string;
    quantity?: number;
    className?: string;
    buttonText?: string;
    showIcon?: boolean;
    iconOnly?: boolean;
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
}

const AddToCartWithValidation: React.FC<AddToCartWithValidationProps> = ({
    productCode,
    productType,
    productName,
    quantity = 1,
    className = '',
    buttonText = 'Add to Cart',
    showIcon = true,
    iconOnly = false,
    onSuccess = () => { },
    onError = () => { }
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { openAuth } = useAuthModal();
    const { cart, refreshCart } = useCart();
    const {
        validationDialog,
        closeValidationDialog,
        addToCartWithValidation
    } = useCartValidation();

    // Check if item is already in cart
    const isInCart = cart?.items?.some(
        item => item.productCode === productCode && item.productType === productType
    );

    const baseButtonClass = iconOnly
        ? `inline-flex items-center justify-center rounded-xl w-10 h-10 shrink-0 transition-all duration-300 shadow-sm active:scale-95 ${className}`
        : `inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 shadow-sm active:scale-95 ${className}`;

    if (isInCart) {
        return (
            <Link
                href="/cart"
                className={`${baseButtonClass} bg-green-600 text-white hover:bg-green-700 hover:shadow-md`}
            >
                {iconOnly
                    ? <ShoppingCart className="h-4 w-4" />
                    : <span className="text-center whitespace-nowrap">✓ Go to Cart</span>
                }
            </Link>
        );
    }

    const handleAddToCart = async () => {
        if (!user) {
            openAuth();
            return;
        }

        setIsLoading(true);
        try {
            const result = await addToCartWithValidation(
                productCode,
                productType,
                productName,
                quantity
            );

            if (result.success) {
                onSuccess(result);
                await refreshCart();
            } else if (!result.requiresConfirmation) {
                onError(result.error || 'Failed to add to cart');
            }
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            onError(error.message || 'Failed to add to cart');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDialogSuccess = async (result: any) => {
        if (result?.success) {
            onSuccess(result);
            await refreshCart();
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50`}
            >
                {isLoading ? (
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : iconOnly ? (
                    <ShoppingCart className="h-4 w-4" />
                ) : (
                    <>
                        {showIcon && <ShoppingCart className="h-5 w-5 shrink-0" />}
                        <span className="text-center whitespace-nowrap">{buttonText}</span>
                    </>
                )}
            </button>

            <ConfirmationDialog
                isOpen={validationDialog.isOpen}
                onClose={closeValidationDialog}
                onConfirm={async () => {
                    if (validationDialog.onConfirm) {
                        const result = await validationDialog.onConfirm();
                        await handleDialogSuccess(result);
                    }
                    closeValidationDialog();
                }}
                title={validationDialog.title}
                message={validationDialog.message}
                type={validationDialog.type === 'error' ? 'danger' : validationDialog.type === 'success' ? 'info' : validationDialog.type}
                confirmText={validationDialog.confirmText}
                cancelText={validationDialog.cancelText}
                isLoading={isLoading}
            />
        </>
    );
};

export default AddToCartWithValidation;
