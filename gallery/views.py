from django.shortcuts import render, redirect
from .models import Asset # Импортируем модель, чтобы спрашивать данные
from .forms import AssetForm
from django.contrib import messages
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
    if request.method == 'POST':
        # Сценарий: Пользователь нажал "Отправить"
        # ВАЖНО: Передаем request.FILES, иначе файл потеряется!
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
        # Если все поля заполнены верно - сохраняем в БД
            form.save()
            messages.success(request, 'Спасибо! Модель успешно загружена!')
            # И перекидываем пользователя на главную
            return redirect('home')
        
    else:
        # Сценарий: Пользователь просто зашел на страницу (GET)
        form = AssetForm() # Создаем пустую форму
    # Отдаем шаблон, передавая туда форму (заполненную ошибками или пустую)
    return render(request, 'gallery/upload.html', {'form': form})
