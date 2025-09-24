from django import forms
from .models import Interest, Profile, Post, Comment  # Agar Post model bhi use karna hai
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django_select2.forms import Select2TagWidget
from django.utils.safestring import mark_safe

class CustomSignupForm(UserCreationForm):
    email = forms.EmailField(required=True)
    name = forms.CharField(required=True, max_length=150)
    photo = forms.ImageField(required=False)

    class Meta:
        model = User
        fields = ['username', 'name', 'email', 'password1', 'password2', 'photo']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['name']

        if commit:
            user.save()
            # Agar photo ko User model me save karna ho to User model extend karna hoga.
            # Yahan photo handling ke liye aapko extra code chahiye.
        return user


# class ProfileForm(forms.ModelForm):
#     class Meta:
#         model = Profile
#         fields = ['bio', 'profile_pic', 'location', 'language_preference']


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'email']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
        }

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = [
            'profile_pic', 'bio', 'location', 'language_preference',
            'gender', 'dob', 'website', 'phone_number', 'interests'
        ]
        widgets = {
            'profile_pic': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'bio': forms.Textarea(attrs={'class': 'form-control'}),
            'location': forms.TextInput(attrs={'class': 'form-control'}),
            'language_preference': forms.TextInput(attrs={'class': 'form-control'}),
            'gender': forms.Select(attrs={'class': 'form-control'}),
            'dob': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'website': forms.URLInput(attrs={'class': 'form-control'}),
            'phone_number': forms.TextInput(attrs={'class': 'form-control'}),
            'interests': Select2TagWidget(attrs={'class': 'form-control', 'data-placeholder': 'Type or select interests'}),
        }

    def save(self, commit=True):
        profile = super().save(commit=False)
        if commit:
            profile.save()

        print("Raw POST interests:", self.data.getlist('interests'))
        print("Cleaned interests:", self.cleaned_data.get('interests'))

        interests_data = self.cleaned_data['interests']
        interests_list = []

        for interest in interests_data:
            if isinstance(interest, str):
                obj, created = Interest.objects.get_or_create(name=interest)
                interests_list.append(obj)
            else:
                interests_list.append(interest)

        profile.interests.set(interests_list)
        if commit:
            profile.save()
        return profile



class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image']
        widgets = {
            'content': forms.Textarea(attrs={
                'placeholder': "What's on your mind?", 
                'rows': 4, 
                'class': 'form-control'
            }),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']