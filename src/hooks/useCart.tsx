import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productStock = await api.get(`/stock/${productId}`).then(response => response.data);
      const product = await api.get(`/products/${productId}`).then(response => response.data);
      const productInCart = await cart.find(item => item.id === productId);
      
      if(!product){
        return;
      }
      if (productStock.amount > 0) {
        if (productInCart) {
          if (productInCart.amount + 1 > productStock.amount) {
            toast.error('Quantidade solicitada fora de estoque');
          } else {
            const newCartList = cart.map(item => {
              if (item.id === productInCart.id) {
                return { ...item, amount: item.amount + 1 };
              }
              return item;
            });
            setCart(newCartList);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList));
          }
        } else {
          setCart([...cart, { ...{ ...product }, amount: 1 }])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]));

        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch (error) {
      console.log(error);
      toast.error('Erro na adição do produto');
    }

  };

  const removeProduct = async (productId: number) => {
    try {
      const product = cart.find(itemCart=>itemCart.id=== productId);
      if (!product) {
        throw new Error(`Product doesn't existis`);
      } else {
        const filteredCard = cart.filter(product => product.id !== productId);
        setCart(filteredCard);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCard));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
     
        const productStock = await api.get(`/stock/${productId}`).then(response => response.data);
        const productInCart=cart.find(itemCart=>itemCart.id===productId);

        if(amount<1){
          return;

        }

        if (productStock.amount < amount ) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const cartUpdated = cart.map(product => {
            if (product.id === productId) {
              return { ...product, amount: amount }
            }
            return product;
          })

          setCart(cartUpdated);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated));
        }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
