from django.shortcuts import render
from .models import Asset # Импортируем модель, чтобы спрашивать данные
def home(request):
# all() возвращает хаос.
# order_by('-created_at') сортирует по полю created_at.
# Минус (-) означает "по убыванию" (DESC).
    assets = Asset.objects.all().order_by('-created_at')
    context_data = {
        'page_title': 'Главная Галерея',
        'assets': assets,
    }
    return render(request, 'gallery/index.html', context_data)

def about(request):
# Мы пока не используем HTML-шаблоны, просто вернем строку.
   
    context_data = {
        'page_title': 'О проекте',
    }
    return render(request, 'gallery/about.html', context_data)


def upload(request):
# Мы пока не используем HTML-шаблоны, просто вернем строку.
   
    context_data = {
        'page_title': 'Загрузка кота',
    }
    return render(request, 'gallery/upload.html', context_data)
