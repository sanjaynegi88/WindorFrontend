import { Role } from './rbac';

export interface MockUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    password: string; // For testing purposes
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    company_name?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    profile_image_url?: string | null;
    sub_account: boolean;
    has_membership: boolean;
}

export const MOCK_USERS: MockUser[] = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@windor.com',
        role: 'admin',
        password: 'password123',
        first_name: 'Admin',
        last_name: 'User',
        phone_number: '123-456-7890',
        company_name: 'Windor Corp',
        address: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        zip: '10001',
        profile_image_url: null,
        sub_account: false,
        has_membership: true,
    },
    {
        id: '2',
        name: 'Property Owner',
        email: 'owner@windor.com',
        role: 'property_owner',
        password: 'password123',
        first_name: null,
        last_name: null,
        phone_number: null,
        company_name: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        profile_image_url: null,
        sub_account: false,
        has_membership: true,
    },
    {
        id: '3',
        name: 'City Inspector',
        email: 'inspector@windor.com',
        role: 'city_inspector',
        password: 'password123',
        first_name: 'Joe',
        last_name: 'Inspector',
        phone_number: '555-0199',
        company_name: 'City Dept',
        address: '10 Government Plaza',
        city: 'Metropolis',
        state: 'NY',
        zip: '10002',
        profile_image_url: null,
        sub_account: false,
        has_membership: true,
    },
    {
        id: '4',
        name: 'Insurance Agent',
        email: 'insurance@windor.com',
        role: 'insurance_company',
        password: 'password123',
        first_name: null,
        last_name: null,
        phone_number: null,
        company_name: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        profile_image_url: null,
        sub_account: false,
        has_membership: true,
    },
    {
        id: '5',
        name: 'Contractor User',
        email: 'contractor@windor.com',
        role: 'contractor',
        password: 'password123',
        first_name: 'Bob',
        last_name: 'Builder',
        phone_number: '555-0123',
        company_name: 'Builder Co',
        address: '456 Construction Rd',
        city: 'Metropolis',
        state: 'NY',
        zip: '10001',
        profile_image_url: null,
        sub_account: false,
        has_membership: true,
    },
];

