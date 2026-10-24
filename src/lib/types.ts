export type StoreAddress = {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
};

export type StoreFormValues = {
    tradeName: string;
    cnpj: string;
    ownerName: string;
    phone: string;
    address: StoreAddress;
};

export type StoreRecord = StoreFormValues & {
    _id: string;
    _creationTime: number;
    ownerId: string;
};

export type CurrentUser = {
    name: string | null;
    email: string | null;
    phone: string | null;
};

export type ProductUnit = "unidade" | "kg" | "pacote";
