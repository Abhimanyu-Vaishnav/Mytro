from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseBadRequest, JsonResponse
from django.db.models import Q

from .forms import ProfileForm, PostForm, CommentForm, UserForm, CustomSignupForm
from .models import Post, Like, Comment, Profile, Follow
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
import json
from django.contrib.auth import get_user_model

User = get_user_model()



def signup_view(request):
    if request.method == 'POST':
        form = CustomSignupForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = CustomSignupForm()
    return render(request, 'core/signup.html', {'form': form})


@login_required
def profile_view(request, username):
    user_profile = get_object_or_404(User, username=username)
    is_following = False
    if request.user.is_authenticated and request.user != user_profile:
        is_following = Follow.objects.filter(follower=request.user, following=user_profile).exists()
    return render(request, 'core/profile.html', {'user_profile': user_profile, 'is_following': is_following})



@login_required
def my_profile_view(request):
    return profile_view(request, username=request.user.username)


@login_required
def edit_profile_view(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)
    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=user)
        profile_form = ProfileForm(request.POST, request.FILES, instance=profile)
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile', username=user.username)
    else:
        user_form = UserForm(instance=user)
        profile_form = ProfileForm(instance=profile)
    return render(request, 'core/edit_profile.html', {
        'user_form': user_form,
        'profile_form': profile_form,
        'user': user,
    })


@login_required
def feed_view(request):
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)

    # Posts from followed users + self
    posts = Post.objects.filter(
        Q(author__in=following_users) | Q(author=request.user)
    ).order_by('-created_at')

    # Suggest users to follow (excluding self and already followed)
    suggestions = User.objects.exclude(id=request.user.id).exclude(id__in=following_users)[:5]

    form = PostForm()
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            new_post = form.save(commit=False)
            new_post.author = request.user
            new_post.save()
            return redirect('feed')

    return render(request, 'core/feed.html', {
        'posts': posts,
        'form': form,
        'suggestions': suggestions,
    })



@login_required
def post_create_view(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True})
            return redirect('feed')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = PostForm()
    return render(request, 'core/post_create.html', {'form': form})


# @login_required
# def like_post(request, post_id):
#     post = get_object_or_404(Post, id=post_id)
#     like, created = Like.objects.get_or_create(user=request.user, post=post)
#     if not created:
#         like.delete()
#     return redirect('feed')


# @login_required
# def add_comment(request, post_id):
#     post = get_object_or_404(Post, id=post_id)
#     if request.method == 'POST':
#         form = CommentForm(request.POST)
#         if form.is_valid():
#             comment = form.save(commit=False)
#             comment.user = request.user
#             comment.post = post
#             comment.save()
#             return redirect('feed')
#     else:
#         form = CommentForm()
#     return render(request, 'core/add_comment.html', {'form': form, 'post': post})


# @login_required
# def edit_post(request, post_id):
#     post = get_object_or_404(Post, id=post_id, author=request.user)
#     if request.method == 'POST':
#         form = PostForm(request.POST, request.FILES, instance=post)
#         if form.is_valid():
#             form.save()
#             return redirect('feed')
#     else:
#         form = PostForm(instance=post)
#     return render(request, 'core/edit_post.html', {'form': form, 'post': post})


@login_required
def follow_user(request, username):
    to_follow = get_object_or_404(User, username=username)
    if to_follow != request.user:
        Follow.objects.get_or_create(follower=request.user, following=to_follow)
    return redirect('profile', username=username)


@login_required
def unfollow_user(request, username):
    to_unfollow = get_object_or_404(User, username=username)
    Follow.objects.filter(follower=request.user, following=to_unfollow).delete()
    return redirect('profile', username=username)


# @login_required
# def edit_comment(request, pk):
#     comment = get_object_or_404(Comment, pk=pk)

#     # Sirf comment ka malik hi edit kar sakta hai
#     if comment.user != request.user:
#         return redirect('feed')  # Ya kisi error page pe redirect karo

#     if request.method == 'POST':
#         form = CommentForm(request.POST, instance=comment)
#         if form.is_valid():
#             form.save()
#             return redirect('feed')  # Ya post detail page jahan se aaya tha
#     else:
#         form = CommentForm(instance=comment)

#     return render(request, 'core/edit_comment.html', {'form': form, 'comment': comment})



@csrf_exempt
def edit_post(request, pk):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
            if not content:
                return HttpResponseBadRequest('Post content cannot be empty')
            post = Post.objects.get(pk=pk, author=request.user)
            post.content = content
            post.save()
            return JsonResponse({'content': post.content})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid request')

@csrf_exempt
def edit_comment(request, pk):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
            if not content:
                return HttpResponseBadRequest('Comment cannot be empty')
            comment = Comment.objects.get(pk=pk, user=request.user)
            comment.content = content
            comment.save()
            return JsonResponse({'content': comment.content})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid request')

@csrf_exempt
def add_comment(request):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            post_id = data.get('post_id')
            comment_text = data.get('comment', '').strip()
            if not post_id or not comment_text:
                return HttpResponseBadRequest('Missing fields')
            post = Post.objects.get(pk=post_id)
            new_comment = Comment.objects.create(user=request.user, post=post, content=comment_text)
            result = {
                'id': new_comment.id,
                'content': new_comment.content,
                'name': new_comment.user.get_full_name() or new_comment.user.username,
                'photoUrl': new_comment.user.profile.profile_pic.url if new_comment.user.profile.profile_pic else '',
                'profile_url': reverse('profile', args=[new_comment.user.username]),
                'date': new_comment.created_at.strftime('%b %d, %Y %H:%M'),
            }
            return JsonResponse(result)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid request')


@csrf_exempt
@login_required
def like_post(request, pk):
    if request.method == 'POST':
        try:
            post = Post.objects.get(pk=pk)
            like_instance = Like.objects.filter(user=request.user, post=post).first()
            if like_instance:
                like_instance.delete()
                liked = False
            else:
                Like.objects.create(user=request.user, post=post)
                liked = True
            like_count = Like.objects.filter(post=post).count()
            return JsonResponse({'like_count': like_count, 'liked': liked})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)



@csrf_exempt
def upload_post_photo(request):
    if request.method == 'POST' and request.user.is_authenticated:
        photo = request.FILES.get('photo')
        post_id = request.POST.get('post_id')
        if not photo or not post_id:
            return HttpResponseBadRequest('Photo and post_id required')
        try:
            post = Post.objects.get(pk=post_id, author=request.user)
            post.image = photo
            post.save()
            return JsonResponse({'photo_url': post.image.url})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid request')

@csrf_exempt
def upload_comment_photo(request):
    if request.method == 'POST' and request.user.is_authenticated:
        photo = request.FILES.get('photo')
        post_id = request.POST.get('post_id')
        comment_id = request.POST.get('comment_id')
        if not photo or not post_id:
            return HttpResponseBadRequest('Photo and post_id required')
        try:
            # Save photo logic here, e.g., create CommentPhoto object or append to comment content
            photo_url = '/media/path_to_photo'  # your real path after saving
            return JsonResponse({'photo_url': photo_url})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid request')

@csrf_exempt
def like_comment(request, pk):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            comment = Comment.objects.get(pk=pk)
            if request.user in comment.likes.all():
                comment.likes.remove(request.user)
            else:
                comment.likes.add(request.user)
            comment.save()
            return JsonResponse({'like_count': comment.likes.count()})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid request')