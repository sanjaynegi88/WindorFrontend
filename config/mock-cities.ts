export interface City {
    id: string;
    name: string;
    state: string;
    zip_codes: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const MOCK_CITIES: City[] = [
    {
        "id": "02fee589-7432-493a-a1ac-c610d1580211",
        "name": "Chicago",
        "state": "IL",
        "zip_codes": [
            "60601",
            "60602",
            "60603"
        ],
        "is_active": true,
        "created_at": "2026-03-18T10:05:29.375Z",
        "updated_at": "2026-03-18T10:05:29.375Z"
    },
    {
        "id": "2e510a73-346d-47e8-8da7-7165694397ff",
        "name": "Los Angeles",
        "state": "CAA",
        "zip_codes": [
            "90001",
            "90002",
            "90003",
            "90004"
        ],
        "is_active": true,
        "created_at": "2026-03-18T10:06:07.184Z",
        "updated_at": "2026-03-18T10:06:07.184Z"
    }
];
