import { Request, Response } from 'express';
import { Configuration } from '../models/configuration';

// Create or update configuration
export const createConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            serviceTaxPercentage,
            dueDays,
            invoiceNoStartingFrom,
            cancelBookingHours,
            invoiceNoPrefix,
            smtpServer,
            smtpEmailAddress,
            smtpEmailPassword,
            smtpEmailPort,
            outstationHasTax
        } = req.body;

        const requiredFields = [
            'serviceTaxPercentage',
            'dueDays',
            'invoiceNoStartingFrom',
            'cancelBookingHours',
            'invoiceNoPrefix',
            'smtpServer',
            'smtpEmailAddress',
            'smtpEmailPassword',
            'smtpEmailPort'
        ];

        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
            return;
        }

        const existingConfig = await Configuration.findOne();

        if (existingConfig) {
            await existingConfig.update({
                serviceTaxPercentage,
                dueDays,
                invoiceNoStartingFrom,
                cancelBookingHours,
                invoiceNoPrefix,
                smtpServer,
                smtpEmailAddress,
                smtpEmailPassword,
                smtpEmailPort,
                outstationHasTax
            });

            res.status(200).json({
                success: true,
                message: 'Configuration updated successfully',
                data: existingConfig
            });
        } else {
            const newConfig = await Configuration.create({
                serviceTaxPercentage,
                dueDays,
                invoiceNoStartingFrom,
                cancelBookingHours,
                invoiceNoPrefix,
                smtpServer,
                smtpEmailAddress,
                smtpEmailPassword,
                smtpEmailPort,
                outstationHasTax
            });

            res.status(201).json({
                success: true,
                message: 'Configuration created successfully',
                data: newConfig
            });
        }

    } catch (error) {
        console.error('Error creating/updating configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get configuration
export const getConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
        const configuration = await Configuration.findOne();

        if (!configuration) {
            res.status(404).json({
                success: false,
                message: 'Configuration not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Configuration retrieved successfully',
            data: configuration
        });

    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};