import mongoose, { Schema, Document, Model } from 'mongoose';
import User from './User';
import Admin from './Admin';


export interface IOrderBeneficiary {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    leadId?: string;
}

export interface IOrderStatusHistory {
    status: string;
    timestamp: Date;
    notes?: string;
}

export interface IOrderReport {
    beneficiaryName: string;
    leadId: string;
    reportUrl?: string;
    reportDownloaded: boolean;
    downloadedAt?: Date;
    reportPath?: string;
}

export interface OrderDocument extends Document {
    orderId: string;
    userId: mongoose.Types.ObjectId;
    adminId: mongoose.Types.ObjectId;
    staffId?: mongoose.Types.ObjectId;
    package: {
        code: string[];
        name: string;
        price: number;
        originalPrice?: number;
        discountPercentage?: number;
        discountAmount?: number;
    };
    beneficiaries: IOrderBeneficiary[];
    contactInfo: {
        email: string;
        mobile: string;
        address: {
            street: string;
            city: string;
            state: string;
            pincode: string;
            landmark?: string;
        };
    };
    appointment: {
        date: string;
        slot: string;
        slotId?: string;
    };
    thyrocare: {
        orderNo?: string;
        status: string;
        statusHistory: IOrderStatusHistory[];
        response?: any;
        error?: string;
        retryCount: number;
        lastRetryAt?: Date;
        lastSyncedAt?: Date;
    };
    reportsHardcopy: 'Y' | 'N';
    reports: IOrderReport[];
    payment: {
        type: 'POSTPAID' | 'PREPAID';
        amount: number;
        status: 'PENDING' | 'PAID' | 'FAILED';
    };
    status: 'PENDING' | 'CREATED' | 'FAILED' | 'CANCELLED' | 'COMPLETED';
    thyrocareDisplayStatus?: string;
    notes?: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    updateThyrocareStatus(newStatus: string, notes?: string): Promise<void>;
    addReport(beneficiaryName: string, leadId: string, reportUrl?: string): Promise<void>;
    markReportDownloaded(leadId: string, reportPath?: string): Promise<void>;
    getCategorizedStatus(): 'COMPLETED' | 'FAILED' | 'PENDING';
}

export interface IOrderModel extends Model<OrderDocument> {
    generateOrderId(): string;
    findByStatus(status: string): Promise<OrderDocument[]>;
    findByThyrocareStatus(thyrocareStatus: string): Promise<OrderDocument[]>;
    findByUser(userId: string | mongoose.Types.ObjectId): Promise<OrderDocument[]>;
    findByAdmin(adminId: string | mongoose.Types.ObjectId): Promise<OrderDocument[]>;
    getCategorizedStats(adminId?: string | mongoose.Types.ObjectId | null): Promise<Record<string, number>>;
}

const orderSchema = new Schema<OrderDocument, IOrderModel>({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        default: null,
    },
    staffId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        default: null,
    },
    package: {
        code: {
            type: [String],
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        originalPrice: {
            type: Number
        },
        discountPercentage: {
            type: Number
        },
        discountAmount: {
            type: Number
        }
    },
    beneficiaries: [{
        name: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true
        },
        leadId: {
            type: String
        }
    }],
    contactInfo: {
        email: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        address: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            },
            landmark: {
                type: String
            }
        }
    },
    appointment: {
        date: {
            type: String,
            required: true
        },
        slot: {
            type: String,
            required: true
        },
        slotId: {
            type: String
        }
    },
    thyrocare: {
        orderNo: {
            type: String
        },
        status: {
            type: String,
            default: 'YET TO ASSIGN'
        },
        statusHistory: [{
            status: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            notes: {
                type: String
            }
        }],
        response: {
            type: Schema.Types.Mixed
        },
        error: {
            type: String
        },
        retryCount: {
            type: Number,
            default: 0
        },
        lastRetryAt: {
            type: Date
        },
        lastSyncedAt: {
            type: Date
        }
    },
    reportsHardcopy: {
        type: String,
        enum: ['Y', 'N'],
        default: 'N'
    },
    reports: [{
        beneficiaryName: {
            type: String,
            required: true
        },
        leadId: {
            type: String,
            required: true
        },
        reportUrl: {
            type: String
        },
        reportDownloaded: {
            type: Boolean,
            default: false
        },
        downloadedAt: {
            type: Date
        },
        reportPath: {
            type: String
        }
    }],
    payment: {
        type: {
            type: String,
            enum: ['POSTPAID', 'PREPAID'],
            default: 'POSTPAID'
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING'
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'CREATED', 'FAILED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    thyrocareDisplayStatus: {
        type: String,
        default: ''
    },
    notes: {
        type: String
    },
    source: {
        type: String,
        default: 'Ayropath'
    }
}, {
    timestamps: true
});

orderSchema.index({ userId: 1 });
orderSchema.index({ adminId: 1 });
orderSchema.index({ staffId: 1 }, { sparse: true });
orderSchema.index({ 'thyrocare.orderNo': 1 });
orderSchema.index({ 'thyrocare.status': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', async function (this: OrderDocument) {
    this.updatedAt = new Date();
});

orderSchema.statics.generateOrderId = function () {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${timestamp.slice(-6)}${random}`;
};

const THYROCARE_DISPLAY_LABELS_MODEL: Record<string, string> = {
    'YET TO ASSIGN':        'Order Booked',
    'Y':                    'Order Booked',
    'ASSIGNED':             'Technician Assigned',
    'ACCEPTED':             'Technician Accepted',
    'STARTED':              'Technician On the Way',
    'ARRIVED':              'Technician Arrived',
    'CONFIRMED':            'Sample Collected',
    'SERVICED':             'Sample at Lab',
    'PARTIAL SERVICED':     'Partially Serviced',
    'RESCHEDULED':          'Appointment Rescheduled',
    'FIX APPOINTMENT':      'Appointment Fixed',
    'DONE':                 'Report Ready',
    'REPORTED':             'Report Released',
    'CANCELLED':            'Cancelled',
    'CANCELLATIONREQUEST':  'Cancellation Requested',
    'CANCELTEST':           'Cancellation Initiated',
    'PERSUASION':           'Follow-up in Progress',
    'CALLBACK':             'Callback Requested',
    'CHARBI PUSHED':        'Assigned to Partner Technician',
    'LAB':                  'Sample at Lab',
};

orderSchema.methods.updateThyrocareStatus = async function (this: OrderDocument, newStatus: string, notes = '') {
    const normalized = newStatus.toUpperCase().trim();
    this.thyrocare.status = normalized;
    this.thyrocare.statusHistory.push({
        status:    normalized,
        timestamp: new Date(),
        notes:     notes,
    });

    // Set user-facing display label
    (this as any).thyrocareDisplayStatus =
        THYROCARE_DISPLAY_LABELS_MODEL[normalized] ?? normalized;

    // Map to outer Order.status
    if (['DONE', 'REPORTED'].includes(normalized)) {
        this.status = 'COMPLETED';
    } else if (normalized === 'CANCELLED') {
        this.status = 'CANCELLED';
    } else if (normalized === 'FAILED') {
        this.status = 'FAILED';
    } else if (this.status === 'PENDING') {
        this.status = 'CREATED';
    }

    await this.save();
};

orderSchema.methods.addReport = async function (this: OrderDocument, beneficiaryName: string, leadId: string, reportUrl = null) {
    const reportIndex = this.reports.findIndex(report =>
        report.beneficiaryName === beneficiaryName && report.leadId === leadId
    );

    if (reportIndex >= 0) {
        this.reports[reportIndex].reportUrl = reportUrl || undefined;
        if (reportUrl) {
            this.reports[reportIndex].reportDownloaded = false;
        }
    } else {
        this.reports.push({
            beneficiaryName,
            leadId,
            reportUrl: reportUrl || undefined,
            reportDownloaded: false
        });
    }

    await this.save();
};

orderSchema.methods.markReportDownloaded = async function (this: OrderDocument, leadId: string, reportPath = null) {
    const report = this.reports.find(r => r.leadId === leadId);
    if (report) {
        report.reportDownloaded = true;
        report.downloadedAt = new Date();
        if (reportPath) {
            report.reportPath = reportPath;
        }
        await this.save();
    }
};

orderSchema.methods.getCategorizedStatus = function (this: OrderDocument) {
    const systemStatus    = this.status;
    const thyrocareStatus = (this.thyrocare?.status ?? '').toUpperCase().trim();

    if (
        systemStatus === 'COMPLETED' ||
        thyrocareStatus === 'DONE'   ||
        thyrocareStatus === 'REPORTED'
    ) {
        return 'COMPLETED';
    }

    if (
        systemStatus === 'CANCELLED' ||
        thyrocareStatus === 'CANCELLED'
    ) {
        return 'CANCELLED';
    }

    if (systemStatus === 'FAILED' || thyrocareStatus === 'FAILED') {
        return 'FAILED';
    }

    return 'PENDING';
};

orderSchema.statics.getCategorizedStats = async function (this: IOrderModel, adminId = null) {
    const matchStage = adminId ? { adminId: new mongoose.Types.ObjectId(adminId as string) } : {};

    const result = await this.aggregate([
        { $match: matchStage },
        {
            $addFields: {
                categorizedStatus: {
                    $switch: {
                        branches: [
                            {
                                case: {
                                    $or: [
                                        { $eq: ['$status', 'COMPLETED'] },
                                        { $eq: ['$thyrocare.status', 'DONE'] },
                                        { $eq: ['$thyrocare.status', 'REPORTED'] }
                                    ]
                                },
                                then: 'COMPLETED'
                            },
                            {
                                case: {
                                    $or: [
                                        { $eq: ['$status', 'CANCELLED'] },
                                        { $eq: ['$thyrocare.status', 'CANCELLED'] }
                                    ]
                                },
                                then: 'CANCELLED'
                            },
                            {
                                case: {
                                    $or: [
                                        { $eq: ['$status', 'FAILED'] },
                                        { $eq: ['$thyrocare.status', 'FAILED'] }
                                    ]
                                },
                                then: 'FAILED'
                            }
                        ],
                        default: 'PENDING'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$categorizedStatus',
                count: { $sum: 1 }
            }
        }
    ]);

    const stats: Record<string, number> = {
        COMPLETED: 0,
        CANCELLED: 0,
        FAILED:    0,
        PENDING:   0
    };

    result.forEach(item => {
        stats[item._id] = item.count;
    });

    return stats;
};

const Order = (mongoose.models.Order as IOrderModel) || mongoose.model<OrderDocument, IOrderModel>('Order', orderSchema);

export default Order;
