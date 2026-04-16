import Login from './Login';

// A tela de registro reutiliza o mesmo componente split-screen do Login,
// alternando o modo com base na rota atual.
export default function Register() {
  return <Login />;
}
