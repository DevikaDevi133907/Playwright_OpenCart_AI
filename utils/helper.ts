export class Helper {
    static convertPriceToNumber(price: string): number {
        const cleaned = price.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned);
    }

    static getProductDetails() {
        return {
            productName: "MacBook Air",
            productQuantity: "1",
            totalPrice: "$1,202.00"
        };
    }

    static getLoginDetails() {
        return {
            email: "pavanol@xyz.com",
            password: "test@123"
        };
    }
}