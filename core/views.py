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
from django.views.decorators.http import require_POST
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


# ADD THESE NEW FUNCTIONS TO YOUR EXISTING views.py

@login_required
@require_POST
def create_post(request):
    """Handle post creation from the modern feed modal"""
    content = request.POST.get('content', '')
    image = request.FILES.get('image')
    
    if content or image:
        post = Post.objects.create(
            author=request.user,
            content=content,
            image=image
        )
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'post_id': post.id})
        return redirect('feed')
    
    return JsonResponse({'success': False, 'error': 'Content or image required'})

@login_required
@require_POST
def repost_post(request, post_id):
    """Handle post reposting"""
    post = get_object_or_404(Post, id=post_id)
    
    # For now, we'll just return success since we don't have repost field
    # You can implement repost logic based on your needs
    return JsonResponse({
        'reposted': True,
        'repost_count': 0  # Update this based on your implementation
    })

@login_required
@require_POST
def delete_post(request, post_id):
    """Delete a post"""
    post = get_object_or_404(Post, id=post_id, author=request.user)
    post.delete()
    return JsonResponse({'success': True})

@login_required
@require_POST
def remove_post_image(request, post_id):
    """Remove image from a post"""
    post = get_object_or_404(Post, id=post_id, author=request.user)
    if post.image:
        post.image.delete(save=False)
        post.image = None
        post.save()
    return JsonResponse({'success': True})

@login_required
@require_POST
def delete_comment(request, comment_id):
    """Delete a comment"""
    comment = get_object_or_404(Comment, id=comment_id, user=request.user)
    comment.delete()
    return JsonResponse({'success': True})

@login_required
@require_POST
def follow_user_api(request, user_id):
    """API endpoint for following users"""
    user_to_follow = get_object_or_404(User, id=user_id)
    
    if user_to_follow != request.user:
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        return JsonResponse({
            'username': user_to_follow.username,
            'following': created
        })
    
    return JsonResponse({'error': 'Cannot follow yourself'}, status=400)

@login_required
def suggested_users(request):
    """Get suggested users to follow"""
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    
    # Get users not followed by current user
    suggestions = User.objects.exclude(id=request.user.id).exclude(id__in=following_users)[:10]
    
    users_data = []
    for user in suggestions:
        users_data.append({
            'id': user.id,
            'name': user.get_full_name() or user.username,
            'username': user.username,
            'photo': user.profile.profile_pic.url if hasattr(user, 'profile') and user.profile.profile_pic else None
        })
    
    return JsonResponse({'users': users_data})

@login_required
@require_POST
def pin_post(request, post_id):
    """Pin a post to profile"""
    post = get_object_or_404(Post, id=post_id, author=request.user)
    # Implement pinning logic here if you have a pinned field
    return JsonResponse({'success': True})

@login_required
def get_comments(request, post_id):
    """Get all comments for a post"""
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.all().order_by('created_at')
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'name': comment.user.get_full_name() or comment.user.username,
            'profile_url': reverse('profile', args=[comment.user.username]),
            'is_owner': comment.user == request.user,
            'photoUrl': comment.user.profile.profile_pic.url if hasattr(comment.user, 'profile') and comment.user.profile.profile_pic else ''
        })
    
    return JsonResponse({'comments': comments_data})

@login_required
def load_more_posts(request):
    """Load more posts for infinite scroll"""
    offset = int(request.GET.get('offset', 0))
    limit = 10
    
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    posts = Post.objects.filter(
        Q(author__in=following_users) | Q(author=request.user)
    ).order_by('-created_at')[offset:offset + limit]
    
    posts_data = []
    for post in posts:
        posts_data.append({
            'id': post.id,
            'content': post.content,
            'author': {
                'username': post.author.username,
                'name': post.author.get_full_name() or post.author.username,
                'photo': post.author.profile.profile_pic.url if hasattr(post.author, 'profile') and post.author.profile.profile_pic else None
            },
            'image': post.image.url if post.image else None,
            'likes_count': post.likes.count(),
            'comments_count': post.comments.count(),
            'created_at': post.created_at.strftime('%b %d, %Y')
        })
    
    return JsonResponse({'posts': posts_data})

def profile(request, username=None):
    if username:
        # Other user's profile
        profile_user = get_object_or_404(User, username=username)
    else:
        # Current user's profile
        if request.user.is_authenticated:
            profile_user = request.user
        else:
            return redirect('login')
    
    posts = Post.objects.filter(user=profile_user).order_by('-created_at')
    
    context = {
        'profile_user': profile_user,
        'posts': posts,
    }
    return render(request, 'core/profile.html', context)
# Add this import at the top if not already present