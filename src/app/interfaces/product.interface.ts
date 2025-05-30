export interface Product{
    category: String;
    description: string;
    id: number;
    image: string;
    price: number;
    quantity: number;
    rating: {rate: number, count: number};
    title: string;
}

export interface ProductItemCart{
    product: Product;
    quantity: number;
}
