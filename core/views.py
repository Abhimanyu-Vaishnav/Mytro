from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from .forms import ProfileForm, PostForm, CommentForm, UserForm
from .models import Post, Like, Comment, Profile 
from .models import Follow
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q


from core import models


from .forms import CustomSignupForm

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
def profile_view(request):
    return render(request, 'core/profile.html', {'user': request.user})

# @login_required
# def edit_profile_view(request):
#     user = request.user
#     profile, created = Profile.objects.get_or_create(user=user)

#     if request.method == 'POST':
#         form = ProfileForm(request.POST, request.FILES, instance=profile)
#         if form.is_valid():
#             form.save()
#             return redirect('profile', username=user.username)
#     else:
#         form = ProfileForm(instance=profile)

#     return render(request, 'core/edit_profile.html', {'form': form})

@login_required
def edit_profile_view(request):
    user = request.user
    profile = None
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=user)

    if request.method == "POST":
        user_form = UserForm(request.POST, instance=user)
        profile_form = ProfileForm(request.POST, request.FILES, instance=profile)
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile', username=user.username)
    else:
        user_form = UserForm(instance=user)
        profile_form = ProfileForm(instance=profile)
    return render(request, "core/edit_profile.html", {
        'user_form': user_form,
        'profile_form': profile_form,
        'user': user,
    })


@login_required
def feed_view(request):
    posts = Post.objects.all().order_by('-created_at')
    return render(request, 'core/feed.html', {'posts': posts})

# @login_required
# def post_create_view(request):
#     if request.method == 'POST':
#         form = PostForm(request.POST, request.FILES)
#         if form.is_valid():
#             post = form.save(commit=False)
#             post.author = request.user
#             post.save()
#             return redirect('feed')
#     else:
#         form = PostForm()
#     return render(request, 'core/post_create.html', {'form': form})


@login_required
def post_create_view(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user  # Ye line zaroor honi chahiye
            post.save()
            return redirect('feed')
    else:
        form = PostForm()
    return render(request, 'core/post_create.html', {'form': form})


@login_required
def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
    return redirect('feed')

@login_required
def add_comment(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if request.method == "POST":
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.post = post
            comment.save()
            return redirect('feed')
    else:
        form = CommentForm()
    return render(request, 'core/add_comment.html', {'form': form, 'post': post})

@login_required
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, author=request.user)
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            form.save()
            return redirect('feed')
    else:
        form = PostForm(instance=post)
    return render(request, 'core/edit_post.html', {'form': form, 'post': post})


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
# def profile_view(request, username):
#     user_profile = get_object_or_404(User, username=username)
#     is_following = Follow.objects.filter(follower=request.user, following=user_profile).exists()
#     return render(request, 'core/profile.html', {'user_profile': user_profile, 'is_following': is_following})


@login_required
def my_profile_view(request):
    return profile_view(request, username=request.user.username)

@login_required
def profile_view(request, username):
    user_profile = get_object_or_404(User, username=username)
    # Follow info etc. ka bhi yahan handle karo
    # Example:
    is_following = False
    if request.user.is_authenticated and request.user != user_profile:
        is_following = Follow.objects.filter(follower=request.user, following=user_profile).exists()

    return render(request, 'core/profile.html', {'user_profile': user_profile, 'is_following': is_following})


@login_required
def feed_view(request):
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    # Suggestions for users to follow (excluding current user and already followed)
    suggestions = User.objects.exclude(id=request.user.id).exclude(id__in=following_users)[:5]

    # Posts only from followed users + self
    posts = Post.objects.filter(
    Q(author__in=following_users) | Q(author=request.user)
    ).order_by('-created_at')


    return render(request, 'core/feed.html', {'posts': posts, 'suggestions': suggestions})



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
