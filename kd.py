import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import TextBox

# Nodo del KD-tree
class Nodo:
    def __init__(self, punto, izquierda=None, derecha=None):
        self.punto = punto
        self.izquierda = izquierda
        self.derecha = derecha

# Construir el KD-tree
def construir_kdtree(puntos, profundidad=0):
    if len(puntos) == 0:
        return None
    
    k = len(puntos[0])  # Dimensionalidad del espacio
    eje = profundidad % k  # Alternar el eje de división
    
    # Ordenar puntos y elegir el punto mediano
    puntos_ordenados = sorted(puntos, key=lambda x: x[eje])
    mediana = len(puntos_ordenados) // 2

    # Crear nodo y construir recursivamente subárboles izquierdo y derecho
    return Nodo(
        punto=puntos_ordenados[mediana],
        izquierda=construir_kdtree(puntos_ordenados[:mediana], profundidad + 1),
        derecha=construir_kdtree(puntos_ordenados[mediana + 1:], profundidad + 1)
    )

# Búsqueda del punto más cercano
def buscar_punto_mas_cercano(nodo, punto_consulta, profundidad=0, mejor=None):
    if nodo is None:
        return mejor

    k = len(punto_consulta)
    eje = profundidad % k

    if mejor is None or np.linalg.norm(punto_consulta - nodo.punto) < np.linalg.norm(punto_consulta - mejor):
        mejor = nodo.punto

    if punto_consulta[eje] < nodo.punto[eje]:
        mejor = buscar_punto_mas_cercano(nodo.izquierda, punto_consulta, profundidad + 1, mejor)
        if np.abs(punto_consulta[eje] - nodo.punto[eje]) < np.linalg.norm(punto_consulta - mejor):
            mejor = buscar_punto_mas_cercano(nodo.derecha, punto_consulta, profundidad + 1, mejor)
    else:
        mejor = buscar_punto_mas_cercano(nodo.derecha, punto_consulta, profundidad + 1, mejor)
        if np.abs(punto_consulta[eje] - nodo.punto[eje]) < np.linalg.norm(punto_consulta - mejor):
            mejor = buscar_punto_mas_cercano(nodo.izquierda, punto_consulta, profundidad + 1, mejor)
    
    return mejor

# Búsqueda de los k puntos más cercanos
def buscar_k_puntos_mas_cercanos(nodo, punto_consulta, k, profundidad=0, mejores=None):
    if nodo is None:
        return mejores
    
    if mejores is None:
        mejores = []
    
    k_dim = len(punto_consulta)
    eje = profundidad % k_dim
    
    dist_actual = np.linalg.norm(punto_consulta - nodo.punto)
    
    if len(mejores) < k or dist_actual < np.linalg.norm(punto_consulta - mejores[-1]):
        mejores.append(nodo.punto)
        mejores.sort(key=lambda x: np.linalg.norm(punto_consulta - x))
        if len(mejores) > k:
            mejores.pop()
    
    if punto_consulta[eje] < nodo.punto[eje]:
        mejores = buscar_k_puntos_mas_cercanos(nodo.izquierda, punto_consulta, k, profundidad + 1, mejores)
        if len(mejores) < k or np.abs(punto_consulta[eje] - nodo.punto[eje]) < np.linalg.norm(punto_consulta - mejores[-1]):
            mejores = buscar_k_puntos_mas_cercanos(nodo.derecha, punto_consulta, k, profundidad + 1, mejores)
    else:
        mejores = buscar_k_puntos_mas_cercanos(nodo.derecha, punto_consulta, k, profundidad + 1, mejores)
        if len(mejores) < k or np.abs(punto_consulta[eje] - nodo.punto[eje]) < np.linalg.norm(punto_consulta - mejores[-1]):
            mejores = buscar_k_puntos_mas_cercanos(nodo.izquierda, punto_consulta, k, profundidad + 1, mejores)
    
    return mejores

# Función para generar puntos aleatorios
def generar_puntos(n):
    puntos = np.random.rand(n, 2)  # Genera 'n' puntos en el rango [0, 1)
    return puntos

# Generar puntos aleatorios
n = 100  # Número de puntos a generar
puntos = generar_puntos(n)

# Construir KD-tree con los puntos generados
kd_tree = construir_kdtree(puntos)

# Variables globales
punto_consulta = None
k = 10  # Número inicial de puntos más cercanos a agrupar

# Función para manejar el evento de clic en la gráfica
def on_click(event):
    global punto_consulta
    punto_consulta = np.array([event.xdata, event.ydata])
    actualizar_grafico()

# Función para manejar el evento de cambio en la caja de texto
def submit(text):
    global k
    k = int(text)
    actualizar_grafico()

# Función para actualizar el gráfico
def actualizar_grafico():
    if punto_consulta is not None:
        plt.clf()
        plt.scatter(puntos[:, 0], puntos[:, 1], label='Puntos')
        plt.scatter(punto_consulta[0], punto_consulta[1], color='red', label='Punto de consulta')
        
        punto_cercano = buscar_punto_mas_cercano(kd_tree, punto_consulta)
        puntos_cercanos = buscar_k_puntos_mas_cercanos(kd_tree, punto_consulta, k)
        
        plt.scatter(punto_cercano[0], punto_cercano[1], color='green', label='Punto más cercano')
        
        for punto in puntos_cercanos:
            if np.array_equal(punto, punto_cercano):
                continue
            plt.scatter(punto[0], punto[1], color='black')

        distancias_cercanos = [np.linalg.norm(punto_consulta - p) for p in puntos_cercanos]
        radio_circulo = distancias_cercanos[-1]
        circle = plt.Circle(punto_consulta, radio_circulo, color='blue', fill=False, linestyle='--', label=f'{k} puntos más cercanos')
        plt.gca().add_artist(circle)

        plt.legend()
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.title('Vecinos más cercanos usando KDTree')
        plt.draw()

# Configurar el gráfico inicial
fig, ax = plt.subplots()
plt.scatter(puntos[:, 0], puntos[:, 1], label='Puntos')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Vecinos más cercanos usando KDTree')
plt.legend()

# Conectar el evento de clic
fig.canvas.mpl_connect('button_press_event', on_click)

# Crear la caja de texto para ingresar el número de puntos a agrupar
axbox = plt.axes([0.2, 0.01, 0.1, 0.05])
text_box = TextBox(axbox, 'K')
text_box.on_submit(submit)

plt.show()
