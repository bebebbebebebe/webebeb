from django.shortcuts import render, redirect
from django.db.models import Q # Импортируем Q-object для сложного поиска
from .models import Asset # Импортируем модель, чтобы спрашивать данные
from .forms import AssetForm
from django.contrib import messages
import base64
from django.core.files.base import ContentFile # Обертка для сохранения файлов
from django.utils import timezone

def home(request):
# all() возвращает хаос.
# order_by('-created_at') сортирует по полю created_at.
# Минус (-) означает "по убыванию" (DESC).
    search_query = request.GET.get('q', '')
    ordering = request.GET.get('ordering', 'new') # По умолчанию 'new'
    days = request.GET.get('days', '')
    assets = Asset.objects.all()
        # 3. Применяем поиск (если пользователь что-то ввел)
    if search_query:
    # icontains = Case Insensitive Contains (содержит, без учета регистра)
    # Если бы у нас было поле 'description', мы бы использовали Q:
    # assets = assets.filter(Q(title__icontains=search_query) |Q(description__icontains=search_query))
        assets = assets.filter(title__icontains=search_query)

    if days == '1':
        assets = assets.filter(created_at__gte=timezone.now() - timezone.timedelta(days=1))

    # 4. Применяем сортировку
    if ordering == 'old':
        assets = assets.order_by('created_at') # От старых к новым
    elif ordering == 'name':
        assets = assets.order_by('title') # По алфавиту
    else:
    # По умолчанию (new) - свежие сверху
        assets = assets.order_by('-created_at')
    # 5. Отдаем результат
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
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            # 1. Создаем объект, но пока НЕ сохраняем в базу (commit=False)
            new_asset = form.save(commit=False)
            
            # 2. Обрабатываем картинку из скрытого поля
            image_data = request.POST.get('image_data')  # Получаем строку Base64
            if image_data:
                # Формат строки: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                # Нам нужно отрезать заголовок "data:image/jpeg;base64,"
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]  # получаем "jpeg"
                
                # Декодируем текст в байты
                data = base64.b64decode(imgstr)
                
                # Создаем имя файла (берем имя модели + .jpg)
                file_name = f"{new_asset.title}_thumb.{ext}"
                
                # Сохраняем байты в поле image
                # ContentFile превращает байты в объект, который понимает Django FileField
                new_asset.image.save(file_name, ContentFile(data), save=False)
            
            # 3. Финальное сохранение в БД
            new_asset.save()
            return redirect('home')
    else:
        form = AssetForm()
    return render(request, 'gallery/upload.html', {'form': form})
