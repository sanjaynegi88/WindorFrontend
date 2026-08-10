export interface SubBrand {
  id: string;
  name: string;
}

export interface BrandItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  sub_brands: SubBrand[] | null;
  created_at: string;
  updated_at: string;
}

export interface MockBrandsResponse {
  data: BrandItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const MOCK_BRANDS_DATA: MockBrandsResponse = {
  data: [
    {
      id: "c66fa4cd-90c5-441f-96e8-15b387685806",
      name: "APPLIANCES",
      category: "NEW_APPLIANCES",
      description: null,
      sub_brands: [
        {
          id: "212131",
          name: "name-1",
        },
        {
          id: "244231",
          name: "name-2",
        },
      ],
      created_at: "2026-05-26T11:02:42.925Z",
      updated_at: "2026-05-26T11:02:42.925Z",
    },
    {
      id: "3637c756-e89e-45a0-8053-53a2280e4563",
      name: "CUBIC-16",
      category: "ROOFING",
      description: null,
      sub_brands: null,
      created_at: "2026-05-09T10:00:00.000Z",
      updated_at: "2026-05-09T11:00:00.000Z",
    },
    {
      id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
      name: "GAF",
      category: "ROOFING",
      description: "Timberline & specialty shingles",
      sub_brands: [
        {
          id: "310001",
          name: "Timberline HDZ",
        },
        {
          id: "310002",
          name: "Grand Sequoia",
        },
      ],
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
    },
    {
      id: "b2c3d4e5-f6a7-8901-bcde-222222222222",
      name: "CERTAINTEED",
      category: "ROOFING",
      description: null,
      sub_brands: null,
      created_at: "2026-06-02T09:30:00.000Z",
      updated_at: "2026-06-02T09:30:00.000Z",
    },
    {
      id: "c3d4e5f6-a7b8-9012-cdef-333333333333",
      name: "OWENS CORNING",
      category: "ROOFING",
      description: "Roofing & insulation products",
      sub_brands: [
        {
          id: "320001",
          name: "Duration Series",
        },
        {
          id: "320002",
          name: "Oakridge Shingles",
        },
      ],
      created_at: "2026-06-03T10:15:00.000Z",
      updated_at: "2026-06-03T10:15:00.000Z",
    },
    {
      id: "d4e5f6a7-b8c9-0123-defa-444444444444",
      name: "JAMES HARDIE",
      category: "SIDING",
      description: "Fiber cement siding solutions",
      sub_brands: [
        {
          id: "410001",
          name: "HardiePlank Lap",
        },
        {
          id: "410002",
          name: "HardieShingle",
        },
      ],
      created_at: "2026-06-05T12:00:00.000Z",
      updated_at: "2026-06-05T12:00:00.000Z",
    },
    {
      id: "e5f6a7b8-c9d0-1234-efab-555555555555",
      name: "PLY GEM",
      category: "SIDING",
      description: null,
      sub_brands: null,
      created_at: "2026-06-06T14:15:00.000Z",
      updated_at: "2026-06-06T14:15:00.000Z",
    },
    {
      id: "f6a7b8c9-d0e1-2345-fabc-666666666666",
      name: "ANDERSEN",
      category: "WINDOWS",
      description: "Windows & Patio Doors",
      sub_brands: [
        {
          id: "510001",
          name: "400 Series",
        },
        {
          id: "510002",
          name: "100 Series",
        },
      ],
      created_at: "2026-06-10T10:00:00.000Z",
      updated_at: "2026-06-10T10:00:00.000Z",
    },
    {
      id: "a7b8c9d0-e1f2-3456-abcd-777777777777",
      name: "PELLA",
      category: "WINDOWS",
      description: null,
      sub_brands: null,
      created_at: "2026-06-11T11:20:00.000Z",
      updated_at: "2026-06-11T11:20:00.000Z",
    },
    {
      id: "b8c9d0e1-f2a3-4567-bcde-888888888888",
      name: "PROVIA",
      category: "DOORS",
      description: "Entry & Storm Doors",
      sub_brands: [
        {
          id: "610001",
          name: "Embarq Fiberglass",
        },
        {
          id: "610002",
          name: "Signet Series",
        },
      ],
      created_at: "2026-06-12T15:00:00.000Z",
      updated_at: "2026-06-12T15:00:00.000Z",
    },
    {
      id: "c9d0e1f2-a3b4-5678-cdef-999999999999",
      name: "THERMA-TRU",
      category: "DOORS",
      description: null,
      sub_brands: null,
      created_at: "2026-06-13T16:00:00.000Z",
      updated_at: "2026-06-13T16:00:00.000Z",
    },
    {
      id: "d0e1f2a3-b4c5-6789-defa-000000000000",
      name: "CLOPAY",
      category: "GARAGE_DOORS",
      description: "Residential Garage Doors",
      sub_brands: [
        {
          id: "710001",
          name: "Gallery Collection",
        },
        {
          id: "710002",
          name: "Classic Collection",
        },
      ],
      created_at: "2026-06-15T16:45:00.000Z",
      updated_at: "2026-06-15T16:45:00.000Z",
    },
    {
      id: "e1f2a3b4-c5d6-7890-efab-121212121212",
      name: "WAYNE DALTON",
      category: "GARAGE_DOORS",
      description: null,
      sub_brands: null,
      created_at: "2026-06-16T17:30:00.000Z",
      updated_at: "2026-06-16T17:30:00.000Z",
    },
  ],
  pagination: {
    total: 13,
    page: 1,
    limit: 1000,
    totalPages: 1,
  },
};

/**
 * Transforms Brand items into select options according to requirements:
 * 1. If brand has sub_brands === null (or empty): brand itself can be selected (uses brand.id).
 * 2. If brand has sub_brands array: parent brand CANNOT be selected (rendered as header/disabled),
 *    and instead its sub-brands can be selected, with sub-brand ID removed/gone (__custom__:<sub_name>).
 */
export function transformBrandsToOptions(brands: BrandItem[]): {
  id: string;
  name: string;
  disabled?: boolean;
  isHeader?: boolean;
  isSubBrand?: boolean;
  parentName?: string;
}[] {
  const options: {
    id: string;
    name: string;
    disabled?: boolean;
    isHeader?: boolean;
    isSubBrand?: boolean;
    parentName?: string;
  }[] = [];

  if (!Array.isArray(brands)) return options;

  brands.forEach((brand) => {
    if (!brand.sub_brands || brand.sub_brands.length === 0) {
      // Sub-brands is null: parent brand is selectable with its ID
      options.push({
        id: brand.id,
        name: brand.name,
      });
    } else {
      // Sub-brands is not null:
      // 1. Parent brand cannot be selected (header/disabled)
      options.push({
        id: `__header__:${brand.id}`,
        name: brand.name,
        disabled: true,
        isHeader: true,
      });

      // 2. Sub-brands can be selected, but their sub-brand ID is gone!
      // Option value is set to __custom__:<sub_name> so sub-brand ID is removed
      brand.sub_brands.forEach((sub: any) => {
        const subName = typeof sub === 'string' ? sub : sub?.name || '';
        if (subName) {
          options.push({
            id: `__custom__:${subName}`,
            name: subName,
            isSubBrand: true,
            parentName: brand.name,
          });
        }
      });
    }
  });

  return options;
}
