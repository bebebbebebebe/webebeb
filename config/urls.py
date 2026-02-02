from django.contrib import admin
from django.urls import path
# Импортируем нашу функцию из приложения gallery
from gallery.views import home

urlpatterns = [
    path('admin/', admin.site.urls),
    # Пустая строка '' означает главную страницу сайта (http://localhost:8000/)
    path('', home, name='home'),

]